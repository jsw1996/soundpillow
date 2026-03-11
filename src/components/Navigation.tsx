import { Home as HomeIcon, Sliders, User, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Screen } from '../types';
import { useTranslation } from '../i18n';
import type { TranslationKeys } from '../i18n/locales/en';

const NAV_ITEMS: { screen: Screen; icon: typeof HomeIcon; labelKey: TranslationKeys }[] = [
  { screen: 'home', icon: HomeIcon, labelKey: 'navHome' },
  { screen: 'sleepcast', icon: BookOpen, labelKey: 'navSleepcast' },
  { screen: 'mixer', icon: Sliders, labelKey: 'navMixer' },
  { screen: 'profile', icon: User, labelKey: 'navProfile' },
];

export function BottomNav({ sleepcastActive = false, onSleepcastNav }: { sleepcastActive?: boolean; onSleepcastNav?: () => void }) {
  const { currentScreen, setCurrentScreen } =
    useAppContext();
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

  return (
    <nav
      className="fixed left-0 right-0 max-w-md mx-auto z-50 px-4"
      style={{ bottom: 'calc(0.5rem + env(safe-area-inset-bottom) * 0.4)' }}
    >
      <div
        className={`flex items-center justify-around px-1 py-1 rounded-[22px] ${
          isSleepcastScreen
            ? 'sleepcast-flat-pill'
            : 'glass-dock'
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.labelKey}
              onClick={() => handleNavClick(item)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-300 ${
                active
                  ? 'text-primary nav-indicator'
                  : isSleepcastScreen ? 'text-[#111217]/40' : 'text-foreground/35'
              }`}
            >
              <Icon size={20} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 1.8} />
              <span className="text-[9px] font-bold tracking-wider uppercase">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
