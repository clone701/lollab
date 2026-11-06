-- クローラー（match-crawler）用のテーブル・列・関数の追加
-- 説明: 定期的に JP の高ランク帯のソロランクの試合を集めるクローラーが使う。
--       - crawler_seeds: 試合を取る元にするプレイヤー（league-v4 のランク一覧から1日1回更新）
--       - matches.rank_tier / match_participants.rank_tier: クローラーが集めた試合のランク帯
--         （収集元プレイヤーの tier。検索由来の試合は NULL）
--       - prune_crawler_matches: 上限を超えたクローラーの試合を古い順に削除する
--
-- 注意: 何度実行しても同じ結果になる。既存の行は変更しない（rank_tier は NULL のまま）。

-- ============================================================================
-- 1. crawler_seeds テーブル
-- ============================================================================
CREATE TABLE IF NOT EXISTS crawler_seeds (
  puuid            text         PRIMARY KEY,
  region           text         NOT NULL,
  tier             text         NOT NULL,
  division         text,
  league_points    int          NOT NULL,
  refreshed_at     timestamptz  NOT NULL,
  last_crawled_at  timestamptz
);
COMMENT ON TABLE crawler_seeds IS 'クローラーの収集元プレイヤー（league-v4 のランク一覧から1日1回更新する）';
COMMENT ON COLUMN crawler_seeds.puuid IS '主キー、プレイヤーの PUUID';
COMMENT ON COLUMN crawler_seeds.region IS 'リージョン（例: JP）';
COMMENT ON COLUMN crawler_seeds.tier IS 'EMERALD / DIAMOND / MASTER / GRANDMASTER / CHALLENGER';
COMMENT ON COLUMN crawler_seeds.division IS 'I〜IV。マスター以上は NULL';
COMMENT ON COLUMN crawler_seeds.league_points IS 'ランク一覧で取得した LP';
COMMENT ON COLUMN crawler_seeds.refreshed_at IS 'ランク一覧で最後に見つかった日時。7日以上前の行は削除する';
COMMENT ON COLUMN crawler_seeds.last_crawled_at IS '最後に試合を収集した日時。未収集は NULL';

CREATE INDEX IF NOT EXISTS crawler_seeds_tier_last_crawled_idx
  ON crawler_seeds (tier, last_crawled_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS crawler_seeds_refreshed_at_idx
  ON crawler_seeds (refreshed_at);

ALTER TABLE crawler_seeds ENABLE ROW LEVEL SECURITY;
-- ポリシーは意図的に作成しない（service キーを使うバックエンドだけがアクセスする）。

-- ============================================================================
-- 2. ランク帯の列
-- ============================================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS rank_tier text;
COMMENT ON COLUMN matches.rank_tier IS 'クローラーが集めた試合のランク帯（収集元プレイヤーの tier）。検索由来の試合は NULL。最初に記録した値を保つ';

ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS rank_tier text;
COMMENT ON COLUMN match_participants.rank_tier IS 'matches から非正規化（ランク帯の絞り込み用）';

-- 上限を超えた試合を古い順に削除するための部分インデックス
CREATE INDEX IF NOT EXISTS matches_crawler_game_end_at_idx
  ON matches (game_end_at) WHERE rank_tier IS NOT NULL;

-- ============================================================================
-- 3. prune_crawler_matches 関数
-- ============================================================================
-- rank_tier を持ち、summoners に登録済みのプレイヤーが参加していない試合を数え、
-- max_matches を超えた分を game_end_at の古い順に最大 batch 件削除する。
-- 参加者・BAN は外部キー（ON DELETE CASCADE）で一緒に消える。削除した件数を返す。
CREATE OR REPLACE FUNCTION prune_crawler_matches(max_matches int, batch int)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  total   int;
  excess  int;
  deleted int;
BEGIN
  IF max_matches IS NULL OR max_matches < 0 OR batch IS NULL OR batch <= 0 THEN
    RAISE EXCEPTION 'max_matches は0以上、batch は1以上を指定してください';
  END IF;

  SELECT count(*) INTO total
  FROM matches m
  WHERE m.rank_tier IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM match_participants p
      JOIN summoners s ON s.puuid = p.puuid
      WHERE p.match_id = m.match_id
    );

  excess := total - max_matches;
  IF excess <= 0 THEN
    RETURN 0;
  END IF;

  DELETE FROM matches
  WHERE match_id IN (
    SELECT m.match_id
    FROM matches m
    WHERE m.rank_tier IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM match_participants p
        JOIN summoners s ON s.puuid = p.puuid
        WHERE p.match_id = m.match_id
      )
    ORDER BY m.game_end_at ASC
    LIMIT LEAST(excess, batch)
  );
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;
COMMENT ON FUNCTION prune_crawler_matches(int, int) IS 'クローラーの試合（検索済みサモナーの参加なし）が max_matches を超えた分を、古い順に最大 batch 件削除し、削除件数を返す';

-- バックエンド（service キー）からだけ呼べるようにする
REVOKE EXECUTE ON FUNCTION prune_crawler_matches(int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION prune_crawler_matches(int, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION prune_crawler_matches(int, int) TO service_role;
