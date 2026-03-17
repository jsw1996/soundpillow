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
    ],
  },
];