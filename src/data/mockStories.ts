import type { GeneratedSleepcast, SleepcastTheme } from '../types';
import { SLEEPCAST_THEMES } from './sleepcastThemes';

const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL || '').replace(/\/+$/, '');

function resolveStoryAudioUrl(blobAudioPath: string): string {
  if (!ASSET_BASE_URL) return blobAudioPath;
  return `${ASSET_BASE_URL}/${blobAudioPath}`;
}

export interface MockStory {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  category: string;
  themeId: SleepcastTheme['id'];
  blobAudioPath: string;
  paragraphCount: number;
  storyPreview: string;
  isTrending?: boolean;
  isTodaysPick?: boolean;
}

export interface StoryCategory {
  id: string;
  label: string;
  emoji: string;
}

export const STORY_CATEGORIES: StoryCategory[] = [
  { id: 'all', label: '全部', emoji: '✨' },
  { id: 'fairy-tale', label: '童话故事', emoji: '🏰' },
  { id: 'animal-friends', label: '动物伙伴', emoji: '🐾' },
  { id: 'city-life', label: '都市生活', emoji: '🌃' },
];

export const MOCK_STORIES: MockStory[] = [
  {
    id: 'story-1',
    title: '周末的跳蚤市场',
    subtitle: '旧物摊位、温柔对话和阳光斜照的周末午后。',
    duration: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    category: 'city-life',
    themeId: 'cabin-rain',
    blobAudioPath: 'audios/stories/01_周末的跳蚤市场.wav',
    paragraphCount: 1,
    storyPreview: '在热闹而放松的周末跳蚤市场里，人们交换旧物，也交换彼此生活里最柔软的小故事。',
    isTrending: true,
  },
  {
    id: 'story-2',
    title: '天台上的天文爱好者',
    subtitle: '在城市屋顶仰望星空，听夜风和望远镜一起变安静。',
    duration: '11 min',
    imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80',
    category: 'city-life',
    themeId: 'stargazing',
    blobAudioPath: 'audios/stories/01_天台上的天文爱好者.wav',
    paragraphCount: 1,
    storyPreview: '一位天文爱好者在城市天台架起望远镜，把远处的星光讲成一段适合入睡的夜话。',
    isTodaysPick: true,
  },
  {
    id: 'story-3',
    title: '流浪猫的新家',
    subtitle: '一只小猫慢慢靠近灯光，也慢慢学会相信温暖。',
    duration: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=800&q=80',
    category: 'animal-friends',
    themeId: 'cabin-rain',
    blobAudioPath: 'audios/stories/01_流浪猫的新家.wav',
    paragraphCount: 1,
    storyPreview: '一只流浪猫在某个安静的夜晚推开了新生活的门，也找到了属于自己的柔软角落。',
    isTrending: true,
  },
  {
    id: 'story-4',
    title: '会唱歌的老橡树',
    subtitle: '森林里的老橡树一到夜里，就会把风变成摇篮曲。',
    duration: '13 min',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    category: 'fairy-tale',
    themeId: 'enchanted-forest',
    blobAudioPath: 'audios/stories/02_会唱歌的老橡树.wav',
    paragraphCount: 1,
    storyPreview: '在一片会发光的森林里，一棵古老的橡树唱着缓慢而温柔的歌，让所有路过的心事都安静下来。',
  },
  {
    id: 'story-5',
    title: '树洞里的邮局',
    subtitle: '每一封信都藏着森林居民最柔软的秘密和思念。',
    duration: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80',
    category: 'fairy-tale',
    themeId: 'enchanted-forest',
    blobAudioPath: 'audios/stories/04_树洞里的邮局.wav',
    paragraphCount: 1,
    storyPreview: '一间开在树洞深处的小小邮局，替森林里的居民传递想念，也替夜晚保存一份安稳。',
  },
  {
    id: 'story-6',
    title: '唱片店的下午',
    subtitle: '黑胶缓缓旋转，旧旋律把城市午后染得更柔和。',
    duration: '11 min',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    category: 'city-life',
    themeId: 'zen-garden',
    blobAudioPath: 'audios/stories/05_唱片店的下午.wav',
    paragraphCount: 1,
    storyPreview: '午后的唱片店有轻微的唱针噪音、木头香气和慢下来的时间，像一首适合睡前回味的歌。',
  },
];

export function getTrendingStories(): MockStory[] {
  return MOCK_STORIES.filter((story) => story.isTrending || story.isTodaysPick);
}

export function getStoriesByCategory(categoryId: string): MockStory[] {
  if (categoryId === 'all') return MOCK_STORIES;
  return MOCK_STORIES.filter((story) => story.category === categoryId);
}

export function getMockStoryTheme(story: MockStory): SleepcastTheme {
  const baseTheme = SLEEPCAST_THEMES.find((theme) => theme.id === story.themeId) ?? SLEEPCAST_THEMES[0];
  return {
    ...baseTheme,
    imageUrl: story.imageUrl,
  };
}

export function getMockStoryCast(story: MockStory): GeneratedSleepcast {
  return {
    id: story.id,
    themeId: story.themeId,
    title: story.title,
    story: story.storyPreview,
    paragraphs: [story.storyPreview],
    audioUrls: [resolveStoryAudioUrl(story.blobAudioPath)],
    createdAt: Date.now(),
  };
}
