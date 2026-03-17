export interface StickerDefinition {
  id: string;
  src: string;
  label: string;
}

export interface StickerCategoryDefinition {
  id: string;
  label: string;
  stickers: StickerDefinition[];
}

export const STICKER_CATALOG: StickerCategoryDefinition[] = [
  {
    id: 'cat',
    label: 'Cat',
    stickers: [
      {
        id: 'cat1',
        src: '/stickers/cat/cat1.png',
        label: 'Cat 1',
      },
      {
        id: 'cat2',
        src: '/stickers/cat/cat2.png',
        label: 'Cat 2',
      },
      {
        id: 'cat3',
        src: '/stickers/cat/cat3.png',
        label: 'Cat 3',
      },
      {
        id: 'cat4',
        src: '/stickers/cat/cat4.png',
        label: 'Cat 4',
      },
      {
        id: 'cat5',
        src: '/stickers/cat/cat5.png',
        label: 'Cat 5',
      },
      {
        id: 'cat6',
        src: '/stickers/cat/cat6.png',
        label: 'Cat 6',
      },
      {
        id: 'cat7',
        src: '/stickers/cat/cat7.png',
        label: 'Cat 7',
      },
      {
        id: 'cat8',
        src: '/stickers/cat/cat8.png',
        label: 'Cat 8',
      },
      {
        id: 'cat9',
        src: '/stickers/cat/cat9.png',
        label: 'Cat 9',
      }
    ],
  },
];