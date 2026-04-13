export interface Item {
    id: string;
    name: string;
    icon: string;
    gold: number;
}

export const STARTER_ITEMS: Item[] = [
    { id: '1055', name: "Doran's Blade", icon: '/images/item/1055.png', gold: 450 },
    { id: '1054', name: "Doran's Shield", icon: '/images/item/1054.png', gold: 450 },
    { id: '1056', name: "Doran's Ring", icon: '/images/item/1056.png', gold: 400 },
    { id: '1083', name: 'Cull', icon: '/images/item/1083.png', gold: 450 },
    { id: '1036', name: 'Long Sword', icon: '/images/item/1036.png', gold: 350 },
    { id: '1082', name: 'Dark Seal', icon: '/images/item/1082.png', gold: 350 },
    { id: '1052', name: 'Amplifying Tome', icon: '/images/item/1052.png', gold: 435 },
    { id: '1001', name: 'Boots', icon: '/images/item/1001.png', gold: 300 },
    { id: '1029', name: 'Cloth Armor', icon: '/images/item/1029.png', gold: 300 },
    { id: '1027', name: 'Sapphire Crystal', icon: '/images/item/1027.png', gold: 350 },
    { id: '1028', name: 'Ruby Crystal', icon: '/images/item/1028.png', gold: 400 },
    { id: '2031', name: 'Refillable Potion', icon: '/images/item/2031.png', gold: 150 },
    { id: '2003', name: 'Health Potion', icon: '/images/item/2003.png', gold: 50 },
    { id: '2055', name: 'Control Ward', icon: '/images/item/2055.png', gold: 75 },
];
