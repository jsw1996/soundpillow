import { config } from './config.js';

export interface AudioTrack {
    id: string;
    title: string;
    artist: string;
    duration: string;
    category: string;
    imageUrl: string;
    imageSourceUrl: string;
    audioUrl: string;
    description: string;
}

export interface StoryCatalogItem extends AudioTrack {
    subtitle: string;
    storyPreview: string;
    paragraphCount: number;
    backgroundMusic: string | undefined;
    isTrending?: boolean;
    isTodaysPick?: boolean;
}

interface AudioTrackDefinition {
    id: string;
    title: string;
    artist: string;
    duration: string;
    category: string;
    imageSourceUrl: string;
    blobCoverPath?: string;
    imageUrl?: string;
    blobAudioPath: string;
    description: string;
    // Story-specific optional fields
    subtitle?: string;
    storyPreview?: string;
    paragraphCount?: number;
    backgroundMusic?: string;
    isTrending?: boolean;
    isTodaysPick?: boolean;
}

const AMBIENT_TRACK_DEFINITIONS: AudioTrackDefinition[] = [
    {
        id: '1',
        title: 'Heavy Rain',
        artist: 'Nature Sounds',
        duration: '45 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1616871154852-e4ba46e8b413?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/heavy-rain.jpg',
        blobAudioPath: 'audios/tracks/heavy_rain2.mp3',
        description: 'Gentle rain falling on tropical leaves.',
    },
    {
        id: '2',
        title: 'Midnight Forest',
        artist: 'Deep Sleep',
        duration: '60 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1514735555661-d3278da9d5ca?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/midnight-forest.jpg',
        blobAudioPath: 'audios/tracks/forest_night2.mp3',
        description: 'The peaceful sounds of a forest.',
    },
    {
        id: '3',
        title: 'Ocean Waves',
        artist: 'Calming Rhythm',
        duration: '30 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1612387364395-9338e6423547?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/ocean-waves.jpg',
        blobAudioPath: 'audios/tracks/sea_wave2.mp3',
        description: 'Rhythmic waves crashing on a sandy shore.',
    },
    {
        id: '4',
        title: 'Purring Cat',
        artist: 'Deep Comfort',
        duration: '20 mins',
        category: 'Animals',
        imageSourceUrl: 'https://images.unsplash.com/photo-1596921825946-d738194fac80?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/purring-cat.jpg',
        blobAudioPath: 'audios/tracks/cat_purr2.mp3',
        description: 'The soothing vibration of a happy cat.',
    },
    {
        id: '5',
        title: 'Morning Mist',
        artist: 'Focus & Calm',
        duration: '40 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1570554797963-c9e212bc8e60?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/morning-mist.jpg',
        blobAudioPath: 'audios/tracks/morning_birds.mp3',
        description: 'Ethereal sounds of a misty morning.',
    },
    {
        id: '6',
        title: 'Wind Howling',
        artist: 'Pure Relaxation',
        duration: '50 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1694433847591-ad261b35e38e?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/wind-howling.jpg',
        blobAudioPath: 'audios/tracks/wind_howling.mp3',
        description: 'The sound of wind howling through the trees.',
    },
    {
        id: '7',
        title: 'Forest Bonfire',
        artist: 'Warm Glow',
        duration: '35 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1620224027739-3d0e4cc395a5?q=80&w=1035&auto=format&fit=crop&w=800&q=80',
        blobCoverPath: 'audios/covers/forest-bonfire.jpg',
        blobAudioPath: 'audios/tracks/bonfire2.mp3',
        description: 'The comforting crackle of a campfire in the woods.',
    },
    {
        id: '8',
        title: 'Rustling Wind',
        artist: 'Nature Sounds',
        duration: '40 mins',
        category: 'Nature',
        imageSourceUrl: 'https://images.unsplash.com/photo-1656340998995-336456a573ef?q=80&w=1015&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/rustling-wind.jpg',
        blobAudioPath: 'audios/tracks/rustling_wind2.mp3',
        description: 'The sound of wind blowing through the trees in a forest.',
    },
    {
        id: '9',
        title: 'Singing Bowl',
        artist: 'Mindful Meditation',
        duration: '30 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://images.unsplash.com/photo-1619968747226-67769140323a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/singing-bowl.jpg',
        blobAudioPath: 'audios/tracks/singing_bowl.mp3',
        description: 'Resonant tones of a Tibetan singing bowl for deep meditation.',
    },
    {
        id: '10',
        title: 'Wind Chimes',
        artist: 'Zen Garden',
        duration: '35 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://images.unsplash.com/photo-1765895193943-35550897cc2d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/wind-chimes.jpg',
        blobAudioPath: 'audios/tracks/wind_chimes.mp3',
        description: 'Delicate wind chimes swaying in a gentle breeze.',
    },
    {
        id: '11',
        title: 'Gentle River',
        artist: 'Meditation Flow',
        duration: '45 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://images.unsplash.com/photo-1506318039632-e5626c0c1394?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/gentle-river.jpg',
        blobAudioPath: 'audios/tracks/river.mp3',
        description: 'A calm river flowing through a peaceful valley.',
    },
    {
        id: '12',
        title: 'Calming Rain',
        artist: 'Inner Peace',
        duration: '40 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
        blobCoverPath: 'audios/covers/rain-on-window.jpg',
        blobAudioPath: 'audios/tracks/calming_rain2.mp3', 
        description: 'Soft rain pattering against a windowpane.',
    },
    {
        id: '13',
        title: 'Theta Waves',
        artist: 'Binaural Beats',
        duration: '30 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://plus.unsplash.com/premium_photo-1679785652664-5893d9829aed?q=80&w=1090&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/theta-waves.jpg',
        blobAudioPath: 'audios/tracks/binaural_theta.mp3',
        description: 'Theta binaural beats for deep relaxation and meditation.',
    },
    {
        id: '14',
        title: 'Delta Waves',
        artist: 'Deep Sleep Binaural',
        duration: '45 mins',
        category: 'Meditation',
        imageSourceUrl: 'https://images.unsplash.com/photo-1621975081039-c814938ea869?q=80&w=1041&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        blobCoverPath: 'audios/covers/delta-waves.jpg',
        blobAudioPath: 'audios/tracks/binaural_delta.mp3',
        description: 'Delta binaural beats to guide you into deep sleep.',
    },
];

const STORY_DEFINITIONS: AudioTrackDefinition[] = [
    {
        id: 'story-1',
        title: '周末的跳蚤市场',
        artist: 'SoundPillow Stories',
        duration: '6 min',
        category: 'city-life',
        imageSourceUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/跳蚤市场.jpg',
        blobAudioPath: 'audios/stories/01_周末的跳蚤市场.wav',
        description: '在热闹又温柔的周末市集里，跟着旧物与陌生人的小故事慢慢入睡。',
        subtitle: '旧物摊位、温柔对话和阳光斜照的周末午后。',
        storyPreview: '在热闹而放松的周末跳蚤市场里，人们交换旧物，也交换彼此生活里最柔软的小故事。',
        paragraphCount: 1,
        isTrending: true,
    },
    {
        id: 'story-2',
        title: '天台上的天文爱好者',
        artist: 'SoundPillow Stories',
        duration: '9 min',
        category: 'city-life',
        imageSourceUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/天台.jpg',
        blobAudioPath: 'audios/stories/01_天台上的天文爱好者.wav',
        backgroundMusic: 'audios/music/Moavii - We Are (freetouse.com).mp3',
        description: '在城市屋顶抬头看星星，听一位天文爱好者分享夜空与安静。',
        subtitle: '在城市屋顶仰望星空，听夜风和望远镜一起变安静。',
        storyPreview: '一位天文爱好者在城市天台架起望远镜，把远处的星光讲成一段适合入睡的夜话。',
        paragraphCount: 1,
        isTodaysPick: true,
    },
    {
        id: 'story-3',
        title: '流浪猫的新家',
        artist: 'SoundPillow Stories',
        duration: '5 min',
        category: 'animal-friends',
        imageSourceUrl: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/流浪猫.jpg',
        blobAudioPath: 'audios/stories/01_流浪猫的新家.wav',
        backgroundMusic: 'audios/music/the_mountain-calm-cinematic-piano-149913.mp3',
        description: '一只流浪猫慢慢学会信任，也在灯光温暖的小屋里找到归属。',
        subtitle: '一只小猫慢慢靠近灯光，也慢慢学会相信温暖。',
        storyPreview: '一只流浪猫在某个安静的夜晚推开了新生活的门，也找到了属于自己的柔软角落。',
        paragraphCount: 1,
        isTrending: true,
    },
    {
        id: 'story-4',
        title: '会唱歌的老橡树',
        artist: 'SoundPillow Stories',
        duration: '6 min',
        category: 'fairy-tale',
        imageSourceUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/老榆树.jpg',
        blobAudioPath: 'audios/stories/02_会唱歌的老橡树.wav',
        description: '森林深处的老橡树会在夜里轻声歌唱，把每个愿望都变成摇篮曲。',
        subtitle: '森林里的老橡树一到夜里，就会把风变成摇篮曲。',
        storyPreview: '在一片会发光的森林里，一棵古老的橡树唱着缓慢而温柔的歌，让所有路过的心事都安静下来。',
        paragraphCount: 1,
    },
    {
        id: 'story-5',
        title: '树洞里的邮局',
        artist: 'SoundPillow Stories',
        duration: '7 min',
        category: 'fairy-tale',
        imageSourceUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/邮局.jpg',
        blobAudioPath: 'audios/stories/04_树洞里的邮局.wav',
        description: '一间藏在树洞里的邮局，替森林居民传递最轻柔的思念与秘密。',
        subtitle: '每一封信都藏着森林居民最柔软的秘密和思念。',
        storyPreview: '一间开在树洞深处的小小邮局，替森林里的居民传递想念，也替夜晚保存一份安稳。',
        paragraphCount: 1,
    },
    {
        id: 'story-6',
        title: '唱片店的下午',
        artist: 'SoundPillow Stories',
        duration: '7 min',
        category: 'city-life',
        imageSourceUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
        imageUrl: 'audios/covers/唱片店.jpg',
        blobAudioPath: 'audios/stories/05_唱片店的下午.wav',
        description: '午后的唱片店里，黑胶缓缓转动，旧时光像音乐一样安静流淌。',
        subtitle: '黑胶缓缓旋转，旧旋律把城市午后染得更柔和。',
        storyPreview: '午后的唱片店有轻微的唱针噪音、木头香气和慢下来的时间，像一首适合睡前回味的歌。',
        paragraphCount: 1,
    },
    {
        id: 'story-7',
        title: '守灯塔的鲸鱼',
        artist: 'SoundPillow Stories',
        duration: '14 min',
        category: 'animal-friends',
        imageSourceUrl: '',
        imageUrl: 'audios/covers/守灯塔的鲸鱼.jpg',
        blobAudioPath: 'audios/stories/07_守灯塔的鲸鱼.wav',
        backgroundMusic: 'audios/music/OnceUponATime_normalized.mp3',
        description: '北方海域的灯塔旁，一头老鲸鱼每晚巡游守护，与守塔老人共同陪伴漫长的夜。',
        subtitle: '礁石灯塔、深海低鸣和一段无需言语的默契陪伴。',
        storyPreview: '在北方孤独的灯塔旁，一头布满伤疤的老鲸鱼每晚准时出现，与守塔人一起度过无数个安静的夜晚。',
        paragraphCount: 1,
    },
    {
        id: 'story-8',
        title: '24小时书店',
        artist: 'SoundPillow Stories',
        duration: '10 min',
        category: 'city-life',
        imageSourceUrl: '',
        imageUrl: 'audios/covers/24h-bookstore.jpg',
        blobAudioPath: 'audios/stories/08_二十四小时书店.wav',
        backgroundMusic: 'audios/music/beautiful-piano-amp-flute-normalized.mp3',
        description: '凌晨两点的书店里，值班员叶青守着橙黄灯光，陪伴每一个深夜到来的读者，直到天亮。',
        subtitle: '暖光书架、翻页声和凌晨不打烊的安静陪伴。',
        storyPreview: '凌晨两点，书店只剩三个人。值班员叶青坐在收银台后，看着深夜来书店的人，每个人都带着各自的故事和一种只有夜里才会有的安静。',
        paragraphCount: 1,
    },
];

function resolveAssetUrl(assetPath: string): string {
    return `${config.assetBaseUrl.replace(/\/+$/, '')}/${assetPath}`;
}

function resolveImageUrl(track: AudioTrackDefinition): string {
    if (track.blobCoverPath) {
        return resolveAssetUrl(track.blobCoverPath);
    }

    if (track.imageUrl) {
        // Resolve relative blob paths; leave absolute URLs (http/https) as-is
        return track.imageUrl.startsWith('http') ? track.imageUrl : resolveAssetUrl(track.imageUrl);
    }

    return track.imageSourceUrl;
}

function mapTrackDefinition(track: AudioTrackDefinition): AudioTrack {
    return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        category: track.category,
        imageUrl: resolveImageUrl(track),
        imageSourceUrl: track.imageSourceUrl,
        audioUrl: resolveAssetUrl(track.blobAudioPath),
        description: track.description,
    };
}

export function getAudioCatalog(): AudioTrack[] {
    return AMBIENT_TRACK_DEFINITIONS.map(mapTrackDefinition);
}

export function getStoryAudioCatalog(): StoryCatalogItem[] {
    return STORY_DEFINITIONS
        .filter((t): t is AudioTrackDefinition & { subtitle: string; storyPreview: string; paragraphCount: number } =>
            !!(t.subtitle && t.storyPreview && t.paragraphCount !== undefined)
        )
        .map((track): StoryCatalogItem => ({
            ...mapTrackDefinition(track),
            subtitle: track.subtitle,
            storyPreview: track.storyPreview,
            paragraphCount: track.paragraphCount,
            backgroundMusic: track.backgroundMusic ? resolveAssetUrl(track.backgroundMusic) : undefined,
            isTrending: track.isTrending,
            isTodaysPick: track.isTodaysPick,
        }));
}