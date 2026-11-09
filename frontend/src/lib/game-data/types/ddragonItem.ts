// Data Dragon の item.json の型（使う項目だけ）

export interface DdragonItem {
  name: string;
  description: string;
  gold: { total: number };
}

export interface DdragonItemData {
  data: Record<string, DdragonItem>;
}
