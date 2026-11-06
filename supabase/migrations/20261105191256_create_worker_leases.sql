-- worker_leases（バックグラウンド処理のリース）の作成
-- 説明: 同じ処理（Backfill など）が同時に複数動かないよう、名前ごとに実行権を貸し出す。
--       取得は「expires_at が NULL または現在時刻より前」の条件付き UPDATE 1回で行い、
--       行がなければ INSERT する。処理の終了時に expires_at を NULL にして返す。
--       aws-migration の lollab-backfill が、name = 'riot-backfill' で使う。
--
-- 注意: 初期データは入れない（行は初回の取得時にアプリが作る）。

-- ============================================================================
-- 1. worker_leases テーブル
-- ============================================================================
CREATE TABLE IF NOT EXISTS worker_leases (
  name        text         PRIMARY KEY,
  holder      text,
  expires_at  timestamptz
);
COMMENT ON TABLE worker_leases IS 'バックグラウンド処理の実行権（リース）を名前ごとに貸し出すテーブル（同時実行の制限用）';
COMMENT ON COLUMN worker_leases.name IS '主キー、処理の名前（例: riot-backfill）';
COMMENT ON COLUMN worker_leases.holder IS '実行中の識別子（Lambda のリクエスト ID など）';
COMMENT ON COLUMN worker_leases.expires_at IS 'リースの期限。NULL または過去なら、他の実行が取得できる';

-- ============================================================================
-- 2. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE worker_leases ENABLE ROW LEVEL SECURITY;
-- ポリシーは意図的に作成しない。
-- RLS を有効にしてポリシーがない場合、anon キー（フロントエンド）からのアクセスは全て拒否される。
-- このテーブルは service キーを使うバックエンドだけがアクセスする（service キーは RLS をバイパスする）。
