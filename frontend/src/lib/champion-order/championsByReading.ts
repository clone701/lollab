import { champions } from '@/lib/data/champions';
import { sortByReading } from './sortByReading';

/** 五十音順のチャンピオン一覧（画面に並べるチャンピオンの元データ） */
export const CHAMPIONS_BY_READING = sortByReading(champions);
