import { Home as HomeIcon, Sliders, Heart, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Screen } from '../types';

const NAV_ITEMS: { screen: Screen; icon: typeof HomeIcon; label: string; onClickOverride?: string }[] = [
  { screen: 'home', icon: HomeIcon, label: 'Home' },
  { screen: 'mixer', icon: Sliders, label: 'Mixer' },
  { screen: 'home', icon: Heart, label: 'Favorites', onClickOverride: 'favorites' },
  { screen: 'profile', icon: User, label: 'Profile' },
];

export function SideMenu() {
  const { currentScreen, setCurrentScreen, showFavoritesOnly, setShowFavoritesOnly, menuOpen, setMenuOpen } =
    useAppContext();

  const handleNavClick = (item: typeof NAV_ITEMS[number]) => {
    if (item.onClickOverride === 'favorites') {
      setShowFavoritesOnly(true);
      setCurrentScreen('home');
    } else {
      setShowFavoritesOnly(false);
      setCurrentScreen(item.screen);
    }
    setMenuOpen(false);
  };

  const isActive = (item: typeof NAV_ITEMS[number]) => {
    if (item.onClickOverride === 'favorites') {
      return currentScreen === 'home' && showFavoritesOnly;
    }
    if (item.screen === 'home') {
      return currentScreen === 'home' && !showFavoritesOnly;
    }
    return currentScreen === item.screen;
  };

  return (
    <AnimatePresence>
      {menuOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-bg-dark border-r border-white/5 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-8 pb-6">
              <h2 className="text-lg font-bold tracking-tight">SoundPillow</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full bg-white/5 active:scale-90 transition-transform"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    <Icon size={22} fill={active ? 'currentColor' : 'none'} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-6 border-t border-white/5">
              <p className="text-[10px] text-white/20 font-medium">SoundPillow v1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
