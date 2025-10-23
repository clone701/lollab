export type StartItem = {
  id: string;
  name: string;
  gold: number;
  icon: string;
};

export const START_ITEMS: StartItem[] = [
  { id: '1055', name: "Doran's Blade", gold: 450, icon: `/images/item/1055.png` },
  { id: '1054', name: "Doran's Shield", gold: 450, icon: `/images/item/1054.png` },
  { id: '1056', name: "Doran's Ring", gold: 400, icon: `/images/item/1056.png` },
  { id: '1036', name: 'Long Sword', gold: 350, icon: `/images/item/1036.png` },
  { id: '1082', name: 'Dark Seal', gold: 350, icon: `/images/item/1082.png` },
  { id: '1001', name: 'Boots', gold: 300, icon: `/images/item/1001.png` },
  { id: '1029', name: 'Cloth Armor', gold: 300, icon: `/images/item/1029.png` },
  { id: '2031', name: '150 Potion', gold: 150, icon: `/images/item/2031.png` },
  { id: '2003', name: 'Health Potion', gold: 50, icon: `/images/item/2003.png` },
];