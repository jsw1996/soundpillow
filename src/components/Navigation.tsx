import { Home as HomeIcon, User, BookOpen, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Screen, Track } from '../types';
import { useTranslation } from '../i18n';
import type { TranslationKeys } from '../i18n/locales/en';
import { useRef, useCallback, useState, useEffect } from 'react';

const NAV_ITEMS: { screen: Screen; icon: typeof HomeIcon; labelKey: TranslationKeys }[] = [
  { screen: 'home', icon: HomeIcon, labelKey: 'navHome' },
  { screen: 'sleepcast', icon: BookOpen, labelKey: 'navSleepcast' },
  { screen: 'canvas', icon: StickyNote, labelKey: 'navCanvas' },
  { screen: 'profile', icon: User, labelKey: 'navProfile' },
];

const LEFT_ITEMS = NAV_ITEMS.slice(0, 2);
const RIGHT_ITEMS = NAV_ITEMS.slice(2);

export interface CollapsedPlayerInfo {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
}

interface BottomNavProps {
  sleepcastActive?: boolean;
  onSleepcastNav?: () => void;
  collapsedPlayer?: CollapsedPlayerInfo | null;
}

export function BottomNav({ sleepcastActive = false, onSleepcastNav, collapsedPlayer }: BottomNavProps) {
  const { currentScreen, setCurrentScreen } = useAppContext();
  const { t } = useTranslation();
  const pillRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLElement | null>>({});
  const [pillPos, setPillPos] = useState<{ left: number; width: number } | null>(null);

  // Measure the active button's position within the nav container.
  // Uses offsetLeft/offsetWidth which reflect CSS layout (ignoring transforms),
  // so measurements stay correct even while Framer Motion layout-animates.
  const measurePill = useCallback(() => {
    const nav = navRef.current;
    const btn = btnRefs.current[currentScreen];
    if (!nav || !btn) return;

    const navW = nav.offsetWidth;
    let left = btn.offsetLeft;
    let width = btn.offsetWidth;

    // Clamp so the pill never exceeds the nav bar bounds
    left = Math.max(0, left);
    width = Math.min(width, navW - left);

    setPillPos({ left, width });
  }, [currentScreen]);

  useEffect(() => {
    // Double-rAF so the DOM layout has settled after React commit
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measurePill);
    });
    window.addEventListener('resize', measurePill);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener('resize', measurePill);
    };
  }, [measurePill]);

  const handleNavClick = useCallback((item: typeof NAV_ITEMS[number]) => {
    if (item.screen === 'sleepcast' && onSleepcastNav) {
      onSleepcastNav();
    }
    setCurrentScreen(item.screen);

    // Trigger squish animation on the pill
    if (pillRef.current) {
      pillRef.current.style.animation = 'none';
      // Force reflow
      void pillRef.current.offsetHeight;
      pillRef.current.style.animation = 'nav-pill-squish 440ms ease';
    }
  }, [onSleepcastNav, setCurrentScreen]);

  // Hide bottom nav on player screen and during active sleepcast
  if (currentScreen === 'player' || sleepcastActive) return null;

  const renderNavButton = (item: typeof NAV_ITEMS[number]) => {
    const Icon = item.icon;
    const active = currentScreen === item.screen;
    return (
      <motion.button
        key={item.labelKey}
        ref={(el: HTMLButtonElement | null) => { btnRefs.current[item.screen] = el; }}
        layout
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        onClick={() => handleNavClick(item)}
        className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-3xl transition-colors duration-300 z-[1] ${
          active ? 'text-primary' : 'text-gray-500'
        }`}
      >
        <Icon
          size={20}
          fill={active ? 'currentColor' : 'none'}
          strokeWidth={active ? 2 : 1.8}
        />
        <span className="text-[9px] font-bold tracking-wider uppercase">{t(item.labelKey)}</span>
      </motion.button>
    );
  };

  return (
    <nav
      className="app-shell-fixed fixed left-0 right-0 z-50 px-4"
      style={{ bottom: 'calc(0.5rem + env(safe-area-inset-bottom) * 0.4)' }}
    >
      <motion.div
        ref={navRef}
        layout="position"
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="liquid-glass-nav mx-auto relative flex max-w-[32rem] items-center rounded-[99em] px-1 py-1"
      >
        {/* Pill clip layer — overflow-hidden keeps the indicator inside the bar */}
        <div className="absolute inset-0 rounded-[99em] overflow-hidden pointer-events-none z-0">
          {pillPos && (
            <motion.div
              ref={pillRef}
              className="liquid-glass-nav-pill absolute top-1 bottom-1 rounded-3xl"
              animate={{ left: pillPos.left, width: pillPos.width }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
            />
          )}
        </div>

        {LEFT_ITEMS.map(renderNavButton)}

        {/* Collapsed mini-player orb in center */}
        <AnimatePresence mode="popLayout">
          {collapsedPlayer && (
            <motion.div
              key="nav-collapsed-player"
              layout
              initial={{ scale: 0, width: 0, opacity: 0 }}
              animate={{ scale: 1, width: 48, opacity: 1 }}
              exit={{ scale: 0, width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="flex-none flex items-center justify-center mx-1"
            >
              <button
                onClick={collapsedPlayer.onExpand}
                className="relative w-11 h-11 rounded-full cursor-pointer active:scale-90 transition-transform -my-1"
              >
                {/* Morphing wave border when playing */}
                {collapsedPlayer.isPlaying && (
                  <>
                    <span className="absolute -inset-1 wave-border wave-border-1" />
                    <span className="absolute -inset-1.5 wave-border wave-border-2" />
                  </>
                )}
                {/* Artwork */}
                <div className={`relative w-11 h-11 rounded-full overflow-hidden shadow-lg shadow-primary/20 opacity-80 ${collapsedPlayer.isPlaying ? 'animate-spin-slow' : 'ring-2 ring-primary/40'}`}>
                  <img
                    src={collapsedPlayer.track.imageUrl}
                    alt={collapsedPlayer.track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {RIGHT_ITEMS.map(renderNavButton)}
      </motion.div>
    </nav>
  );
}
