import React from 'react';
import type { SleepcastTheme } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { getSceneVisual } from './utils';
import type { SceneVisual } from './types';

const SLEEPCAST_LIGHT_BACKGROUND = 'linear-gradient(315deg, #ffffff, #def1ff)';
const SLEEPCAST_DARK_BACKGROUND = 'linear-gradient(180deg, #0f1219 0%, #141925 46%, #0c1016 100%)';

function PaperBackdrop({ theme }: { theme: SleepcastTheme }) {
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const visual = getSceneVisual(theme.id);
  const background = isDark ? SLEEPCAST_DARK_BACKGROUND : SLEEPCAST_LIGHT_BACKGROUND;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background }} />
      <div
        className="absolute inset-x-6 top-28 h-40 rounded-[3rem] opacity-70 blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.haze} 0%, transparent 72%)`, opacity: isDark ? 0.9 : 0.7 }}
      />
      <div
        className="absolute -right-12 top-36 h-44 w-44 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)`, opacity: isDark ? 0.85 : 1 }}
      />
      <div
        className="absolute -left-10 bottom-32 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.rim} 0%, transparent 72%)`, opacity: isDark ? 0.85 : 1 }}
      />
      <div className={`absolute inset-x-5 top-[11.75rem] h-px ${isDark ? 'bg-white/8' : 'bg-black/5'}`} />
      <div className={`absolute right-8 top-[20rem] grid grid-cols-6 gap-2 ${isDark ? 'opacity-35' : 'opacity-25'}`}>
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className={`h-1 w-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
        ))}
      </div>
    </div>
  );
}

export function ScreenFrame({
  children,
  theme,
  bottomPadding = 'calc(1.5rem + env(safe-area-inset-bottom))',
}: {
  children: React.ReactNode;
  theme: SleepcastTheme;
  bottomPadding?: string;
}) {
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const background = isDark ? SLEEPCAST_DARK_BACKGROUND : SLEEPCAST_LIGHT_BACKGROUND;

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${isDark ? 'text-white' : 'text-[#17181c]'}`} style={{ background }}>
      <PaperBackdrop theme={theme} />
      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col px-5"
        style={{
          background,
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: bottomPadding,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function HeaderBadge({ imageUrl }: { imageUrl: string }) {
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';

  return (
    <div className={`relative h-[4.4rem] w-[4.4rem] overflow-hidden rounded-[1.15rem] border shadow-[0_14px_30px_rgba(23,24,28,0.09)] ${isDark ? 'border-white/10 bg-white/6' : 'border-white/70 bg-white'}`}>
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
    </div>
  );
}

export function ThemeArtwork({
  theme,
  visual,
  title,
  statusLabel,
}: {
  theme: SleepcastTheme;
  visual: SceneVisual;
  title: string;
  statusLabel: string;
}) {
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[42%] items-center justify-center">
      <div className="relative h-[82%] w-full">
        <div
          className="absolute right-[10%] top-[18%] h-24 w-24 rounded-full opacity-90 shadow-[0_20px_44px_rgba(0,0,0,0.24)]"
          style={{
            background: 'radial-gradient(circle at 34% 34%, rgba(255,255,255,0.15), rgba(0,0,0,0.92) 70%)',
          }}
        />
        <div className={`absolute left-[6%] top-[10%] h-28 w-24 -rotate-[14deg] overflow-hidden rounded-[1rem] shadow-[0_18px_34px_rgba(0,0,0,0.18)] ${isDark ? 'bg-[#0e1218]' : 'bg-[#17181c]'}`}>
          <img
            src={theme.imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-88"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/58" />
          <div className="absolute inset-x-2 bottom-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/88">
            {title.slice(0, 10)}
          </div>
        </div>
        <div className={`absolute left-[24%] top-[30%] h-28 w-24 rotate-[10deg] overflow-hidden rounded-[1rem] shadow-[0_18px_34px_rgba(0,0,0,0.18)] ${isDark ? 'bg-white/8' : 'bg-white'}`}>
          <img
            src={theme.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/32" />
        </div>
        <div
          className="absolute left-[18%] top-[60%] rotate-[-10deg] rounded-[0.95rem] px-4 py-3 text-sm font-black uppercase tracking-[0.05em] shadow-[0_18px_34px_rgba(0,0,0,0.16)]"
          style={{ background: visual.sticker, color: visual.stickerInk }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
