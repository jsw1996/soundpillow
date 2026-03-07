import { motion, AnimatePresence } from 'motion/react';
import type { MoodEntry } from '../types';
import { useMoodCheckIn } from '../hooks/useMoodCheckIn';
import { MoodBackground } from './mood/MoodBackground';
import { MoodSelectSheet } from './mood/MoodSelectSheet';
import { LoadingSheet } from './mood/LoadingSheet';
import { MoodCardSheet } from './mood/MoodCardSheet';

interface Props {
  onComplete: (entry: MoodEntry) => void;
  onDismiss: () => void;
  requireCheckIn?: boolean;
}

export function MoodCheckIn({ onComplete, onDismiss, requireCheckIn = true }: Props) {
  const {
    step,
    entry,
    pendingMood,
    hoveredMood,
    sharing,
    dismissing,
    introComplete,
    splashConfig,
    activeConfig,
    loadedImages,
    handleSelect,
    handleDismiss,
    handleShare,
    setExitComplete,
    setHoveredMood,
  } = useMoodCheckIn({ onComplete, onDismiss, requireCheckIn });

  return (
    <AnimatePresence mode="wait" onExitComplete={setExitComplete}>
      {!dismissing && (
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black"
          onClick={(e) => {
            if (e.target === e.currentTarget && introComplete && step === 'select' && requireCheckIn) {
              handleDismiss();
            }
          }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <MoodBackground
              config={splashConfig}
              imageLoaded={loadedImages.has(splashConfig.imageUrl)}
              hideGradient
            >
              <div />
            </MoodBackground>
          </motion.div>

          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/35"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: introComplete ? 0.82 : 0.6 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          <AnimatePresence>
            {step === 'card' && (
              <motion.div
                key="card-blur-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 bg-black/30 backdrop-blur-2xl"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!introComplete && (
              <motion.div
                key="startup-image-only"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 flex flex-1"
              />
            )}
          </AnimatePresence>

          {introComplete && requireCheckIn && (
            <div className="relative z-10 w-full">
              <AnimatePresence mode="wait">
                {step === 'select' && (
                  <MoodSelectSheet
                    key="select"
                    hovered={hoveredMood}
                    onHover={setHoveredMood}
                    onSelect={handleSelect}
                    onDismiss={handleDismiss}
                  />
                )}
                {step === 'loading' && pendingMood && (
                  <LoadingSheet key="loading" mood={pendingMood} />
                )}
                {step === 'card' && entry && activeConfig && (
                  <MoodCardSheet
                    key="card"
                    entry={entry}
                    config={activeConfig}
                    sharing={sharing}
                    onShare={handleShare}
                    onDone={handleDismiss}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
