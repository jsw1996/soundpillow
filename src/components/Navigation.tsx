import { Home as HomeIcon, User, BookOpen, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Screen, Track } from '../types';
import { useTranslation } from '../i18n';
import type { TranslationKeys } from '../i18n/locales/en';

const NAV_ITEMS: { screen: Screen; icon: typeof HomeIcon; labelKey: TranslationKeys }[] = [
  { screen: 'home', icon: HomeIcon, labelKey: 'navHome' },
  { screen: 'sleepcast', icon: BookOpen, labelKey: 'navSleepcast' },
  { screen: 'canvas', icon: StickyNote, labelKey: 'navCanvas' },
  { screen: 'profile', icon: User, labelKey: 'navProfile' },
];

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
  const isSleepcastScreen = currentScreen === 'sleepcast';

  const handleNavClick = (item: typeof NAV_ITEMS[number]) => {
    if (item.screen === 'sleepcast' && onSleepcastNav) {
      onSleepcastNav();
    }
    setCurrentScreen(item.screen);
  };

  const isActive = (item: typeof NAV_ITEMS[number]) => {
    return currentScreen === item.screen;
  };

  // Hide bottom nav on player screen and during active sleepcast
  if (currentScreen === 'player' || sleepcastActive) return null;

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);
  const hasCollapsed = !!collapsedPlayer;

  const renderNavButton = (item: typeof NAV_ITEMS[number]) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <motion.button
        key={item.labelKey}
        layout
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        onClick={() => handleNavClick(item)}
        className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors duration-300 ${
          active
            ? 'text-primary nav-indicator'
            : isSleepcastScreen ? 'text-gray-500' : 'text-gray-500'
        }`}
      >
        <Icon size={20} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 1.8} />
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
        layout="position"
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={`mx-auto flex max-w-[32rem] items-center justify-around px-1 py-1 rounded-[22px] ${
          isSleepcastScreen
            ? 'sleepcast-flat-pill'
            : 'glass-dock'
        }`}
      >
        {leftItems.map(renderNavButton)}

        {/* Collapsed mini-player orb in center */}
        <AnimatePresence mode="popLayout">
          {hasCollapsed && collapsedPlayer && (
            <motion.div
              key="nav-collapsed-player"
              layout
              initial={{ scale: 0, width: 0, opacity: 0 }}
              animate={{ scale: 1, width: 48, opacity: 1 }}
              exit={{ scale: 0, width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="flex items-center justify-center"
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

        {rightItems.map(renderNavButton)}
      </motion.div>
    </nav>
  );
}
