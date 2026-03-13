import { motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { MoodCanvas } from './mood/MoodCanvas';

export function MoodCanvasScreen() {
  return (
    <motion.div
      {...screenTransition}
      className="flex-1 overflow-hidden"
    >
      <MoodCanvas />
    </motion.div>
  );
}
