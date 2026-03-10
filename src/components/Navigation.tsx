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
      className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 backdrop-blur-xl pt-2 ${
        isSleepcastScreen
          ? 'bg-[#eef6fc]/92 border-t border-black/6'
          : 'bg-bg-dark/90 border-t border-foreground/5'
      }`}
      style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom) * 0.4)' }}
    >
      <div className="flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.labelKey}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                active ? 'text-primary' : 'text-foreground/40'
              }`}
            >
              <Icon size={22} fill={active ? 'currentColor' : 'none'} />
              <span className="text-[10px] font-semibold tracking-wide">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
