import type { MoodLevel } from '../types';

export interface MoodConfig {
  level: MoodLevel;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  /** Tailwind bg-gradient classes */
  bgClass: string;
  /** Per-locale arrays of uplifting messages (4 options, rotated by day) */
  messages: Record<string, string[]>;
}

export const MOODS: MoodConfig[] = [
  {
    level: 'tired',
    emoji: '😴',
    gradientFrom: '#4F46E5',
    gradientTo: '#7C3AED',
    bgClass: 'from-[#4F46E5] to-[#7C3AED]',
    messages: {
      en: [
        "Rest is not giving up — it's gearing up. Let the night carry you. 🌙",
        "Being tired is brave. You gave today everything. Now let it go. 💜",
        "Your body is wise. When it asks for rest, listen. Tonight is yours. 🌟",
        "Stars shine brightest on tired nights. You're right on time. 🌌",
      ],
      zh: [
        "休息不是放弃，而是充电。让夜晚托住你。🌙",
        "疲惫是勇敢的证明。你已经给了今天一切，放手吧。💜",
        "你的身体很智慧。当它需要休息时，聆听它。今晚是你的。🌟",
        "星星在疲惫的夜晚闪耀得最亮。你来得正是时候。🌌",
      ],
      ja: [
        "休むことは諦めじゃない、次への充電です。夜があなたを運んでくれます。🌙",
        "疲れているのは勇敢な証拠。今日を全力で生きたから。手放しましょう。💜",
        "体は賢い。休みを求めるとき、耳を傾けて。今夜はあなたのもの。🌟",
        "星は疲れた夜に最も輝く。あなたは今、ちょうど良い場所にいます。🌌",
      ],
      es: [
        "Descansar no es rendirse — es recargarse. Deja que la noche te lleve. 🌙",
        "Estar cansado es valiente. Le diste todo a este día. Ahora suéltalo. 💜",
        "Tu cuerpo es sabio. Cuando pide descanso, escúchalo. Esta noche es tuya. 🌟",
        "Las estrellas brillan más en las noches de cansancio. Llegaste justo a tiempo. 🌌",
      ],
    },
  },
  {
    level: 'meh',
    emoji: '😐',
    gradientFrom: '#6366F1',
    gradientTo: '#A78BFA',
    bgClass: 'from-[#6366F1] to-[#A78BFA]',
    messages: {
      en: [
        "Not every day needs to sparkle. Meh days are valid days too. 🌿",
        "Halfway there is still moving forward. That counts for everything. 🚶",
        "Clouds pass. Even a meh day ends in stars. Keep going. ⭐",
        "On meh days, just showing up is the win. You showed up. 🙌",
      ],
      zh: [
        "不是每天都需要闪耀。平淡的日子也是有价值的日子。🌿",
        "走了一半仍在前行，这已经很了不起了。🚶",
        "云朵会过去。就算是平淡的一天，也以星光结尾。继续吧。⭐",
        "在平淡的日子里，出现本身就是胜利。你出现了。🙌",
      ],
      ja: [
        "毎日輝く必要はない。そこそこの日も立派な一日です。🌿",
        "半分でも前に進んでいる。それだけで十分。🚶",
        "雲は流れる。そこそこの日だって、星で終わります。前へ。⭐",
        "そこそこな日に現れること自体が勝利。あなたは現れた。🙌",
      ],
      es: [
        "No todos los días tienen que brillar. Los días así también son válidos. 🌿",
        "A medio camino todavía es avanzar. Eso vale todo. 🚶",
        "Las nubes pasan. Incluso un día así termina en estrellas. Sigue. ⭐",
        "En días así, solo aparecer es la victoria. Tú apareciste. 🙌",
      ],
    },
  },
  {
    level: 'okay',
    emoji: '🙂',
    gradientFrom: '#10B981',
    gradientTo: '#3B82F6',
    bgClass: 'from-[#10B981] to-[#3B82F6]',
    messages: {
      en: [
        "Okay is more than enough. Life is mostly okay, and that's pretty wonderful. 🌸",
        "An okay day still has moments worth keeping. Notice them. 🌱",
        "From okay to wonderful is a short trip. Tomorrow has potential. 🌈",
        "You're steady, and steady is strong. Cheers to an okay day! 🥂",
      ],
      zh: [
        "还好已经足够了。生活大多时候是还好，那其实挺美妙的。🌸",
        "还好的一天里仍有值得珍藏的时刻。留意它们。🌱",
        "从还好到美好，距离很近。明天充满可能。🌈",
        "你很稳定，而稳定就是力量。为还好的一天干杯！🥂",
      ],
      ja: [
        "まあまあで十分。人生はたいていまあまあで、それって素晴らしいこと。🌸",
        "まあまあの日にも、大切な瞬間がある。気づいてみて。🌱",
        "まあまあから素晴らしいは、すぐそこにある。明日が楽しみ。🌈",
        "あなたは安定している。安定こそ強さです。まあまあな一日に乾杯！🥂",
      ],
      es: [
        "Bien está de sobra. La vida es mayormente bien, y eso es bastante maravilloso. 🌸",
        "Un día bien todavía tiene momentos que guardar. Nótalos. 🌱",
        "De bien a maravilloso es un viaje corto. Mañana tiene potencial. 🌈",
        "Eres constante, y la constancia es fuerza. ¡Salud por un día bien! 🥂",
      ],
    },
  },
  {
    level: 'good',
    emoji: '😊',
    gradientFrom: '#F59E0B',
    gradientTo: '#EF4444',
    bgClass: 'from-[#F59E0B] to-[#EF4444]',
    messages: {
      en: [
        "Good days deserve to be felt fully. You're absolutely glowing today! ☀️",
        "This good feeling? It's yours. You earned it just by being you. 🌻",
        "Good days are contagious — someone around you smiled because of you. 😊",
        "Bottle this feeling. Open it on the hard days. You deserve this! 💛",
      ],
      zh: [
        "好日子值得被完全感受。你今天在发光！☀️",
        "这种好心情？是你的。只要做自己，你就赢得了它。🌻",
        "好日子会传染——你周围有人刚刚因为你而微笑了。😊",
        "把这种感觉装进瓶子里。在艰难的日子打开它。你值得！💛",
      ],
      ja: [
        "良い日は全身で感じるもの。今日のあなたは輝いています！☀️",
        "この良い気持ち？あなたのもの。ただ自分らしくいるだけで手に入れた。🌻",
        "良い日は伝染する — あなたのせいで誰かが笑顔になりました。😊",
        "この感覚を瓶に詰めて。辛い日に開けてね。あなたはそれに値する！💛",
      ],
      es: [
        "¡Los buenos días merecen sentirse por completo. Hoy brillas! ☀️",
        "¿Este buen sentimiento? Es tuyo. Lo ganaste solo por ser tú. 🌻",
        "Los buenos días son contagiosos — alguien a tu alrededor sonrió gracias a ti. 😊",
        "¡Embotella este sentimiento. Ábrelo en los días difíciles. Te lo mereces! 💛",
      ],
    },
  },
  {
    level: 'amazing',
    emoji: '🤩',
    gradientFrom: '#8B5CF6',
    gradientTo: '#EC4899',
    bgClass: 'from-[#8B5CF6] to-[#EC4899]',
    messages: {
      en: [
        "You're absolutely vibrating today. The whole world can feel it! ✨",
        "Amazing days don't happen by accident — you brought this energy! 🌟",
        "Whatever you're doing, keep doing it. You're magnetic today. 🎉",
        "Save this feeling as a reminder: you're capable of this every single day. 💫",
      ],
      zh: [
        "你今天简直在振动发光。全世界都能感受到！✨",
        "美好的日子不是偶然——是你带来了这份能量！🌟",
        "不管你在做什么，继续做。你今天有磁场。🎉",
        "把这一刻保存下来：你每一天都有这种能力。💫",
      ],
      ja: [
        "今日のあなたは完全に輝いている。世界が感じています！✨",
        "最高な日は偶然じゃない — あなたがこのエネルギーをもたらした！🌟",
        "何をやっているにしても、続けて。今日のあなたは磁力がある。🎉",
        "この感覚を覚えておいて：あなたは毎日こうなれる。💫",
      ],
      es: [
        "¡Hoy estás absolutamente vibrando. El mundo entero puede sentirlo! ✨",
        "¡Los días increíbles no pasan por accidente — tú trajiste esta energía! 🌟",
        "Lo que sea que estés haciendo, sigue haciéndolo. Hoy eres magnético. 🎉",
        "¡Guarda este sentimiento como recordatorio: eres capaz de esto cada día. 💫",
      ],
    },
  },
];

/** Returns today's message for a mood, rotating across the 4 options day by day. */
export function getMoodMessage(mood: MoodLevel, locale: string): string {
  const config = MOODS.find((m) => m.level === mood)!;
  const pool = config.messages[locale] ?? config.messages.en;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return pool[dayOfYear % pool.length];
}
