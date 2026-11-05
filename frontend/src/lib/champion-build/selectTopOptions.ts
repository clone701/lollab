import type {
  BuildElement,
  BuildMode,
  BuildOption,
} from '@/types/championBuild';
import { calcWinRate } from './calcWinRate';

/**
 * 表示モードに応じて上位の選択肢を返す（4〜6番目のアイテムの「OR」表示用）。
 * 最多は試合数の多い順。最高勝率は勝率の高い順（同率は試合数の多い順）で、
 * 候補は API が返す options（試合数上位）と best_win_rate。
 */
export function selectTopOptions(
  element: BuildElement,
  mode: BuildMode,
  limit = 3
): BuildOption[] {
  if (mode !== 'best_win_rate') return element.options.slice(0, limit);
  const candidates = [...element.options];
  const best = element.best_win_rate;
  if (best && !candidates.some((o) => o.key.join() === best.key.join())) {
    candidates.push(best);
  }
  return candidates
    .sort(
      (a, b) =>
        calcWinRate(b.wins, b.games) - calcWinRate(a.wins, a.games) ||
        b.games - a.games
    )
    .slice(0, limit);
}
