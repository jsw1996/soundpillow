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
        src: '/stckers/cat/cat1.png',
        label: 'Cat 1',
      },
    ],
  },
];