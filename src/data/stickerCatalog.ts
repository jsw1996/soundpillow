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
  {
    id: 'coffee',
    label: 'Coffee',
    stickers: [
      {
        id: 'coffee1',
        src: '/stickers/coffee/coffee1.png',
        label: 'Coffee 1',
      },
      {
        id: 'coffee2',
        src: '/stickers/coffee/coffee2.png',
        label: 'Coffee 2',
      },
      {
        id: 'coffee3',
        src: '/stickers/coffee/coffee3.png',
        label: 'Coffee 3',
      },
      {
        id: 'coffee4',
        src: '/stickers/coffee/coffee4.png',
        label: 'Coffee 4',
      },
      {
        id: 'coffee5',
        src: '/stickers/coffee/coffee5.png',
        label: 'Coffee 5',
      },
      {
        id: 'coffee6',
        src: '/stickers/coffee/coffee6.png',
        label: 'Coffee 6',
      }
    ],  
  }
];