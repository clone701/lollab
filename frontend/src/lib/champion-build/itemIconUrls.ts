import { DDRAGON_VERSION } from './constants';

/** アイテム画像のローカルパスと、ローカルに無い場合の Data Dragon の URL */
export function itemIconUrls(id: number): { src: string; fallbackSrc: string } {
  return {
    src: `/images/item/${id}.png`,
    fallbackSrc: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${id}.png`,
  };
}
