import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { MoodCanvas } from './mood/MoodCanvas';
import { MoodGridView } from './mood/MoodGridView';
import { useAppContext } from '../context/AppContext';
import { LIGHT_PALETTE, DARK_PALETTE } from './mood/canvasTheme';

export function MoodCanvasScreen() {
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const palette = useMemo(() => (isDark ? DARK_PALETTE : LIGHT_PALETTE), [isDark]);

  const [view, setView] = useState<'grid' | 'day'>('grid');
  const [focusDate, setFocusDate] = useState<string | null>(null);

  const handleSelectDate = (date: string) => {
    setFocusDate(date);
    setView('day');
  };

  const handleBack = () => {
    setView('grid');
    setFocusDate(null);
  };

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {view === 'grid' ? (
          <motion.div
            key="grid"
            className="h-full w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <MoodGridView
              palette={palette}
              isDark={isDark}
              onSelectDate={handleSelectDate}
            />
          </motion.div>
        ) : (
          <motion.div
            key="day"
            className="h-full w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <MoodCanvas focusDate={focusDate ?? undefined} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
