import { champions } from '@/lib/data/champions';
import { sortByReading } from './sortByReading';

/** 五十音順のチャンピオン一覧（編集・閲覧の行と、チャンピオン選択の並び順に使う） */
export const CHAMPIONS_BY_READING = sortByReading(champions);
