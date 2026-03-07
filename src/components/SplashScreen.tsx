import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { tracks } = useAppContext();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const randomImage = useMemo(() => {
    const images = tracks.map(t => t.imageUrl).filter(Boolean);
    if (!images.length) return '';
    const selected = images[Math.floor(Math.random() * images.length)];
    console.log('[SplashScreen] selected image', selected);
    return selected;
  }, [tracks]);

  useEffect(() => {
    console.log('[SplashScreen] mounted');

    const exitTimer = setTimeout(() => setIsExiting(true), 2000);
    const completeTimer = setTimeout(onComplete, 2600);

    console.log('[SplashScreen] timers started', { exitAfterMs: 2000, completeAfterMs: 2600 });

    return () => {
      console.log('[SplashScreen] cleanup');
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    console.log('[SplashScreen] state changed', { imageLoaded, isExiting });
  }, [imageLoaded, isExiting]);

  useEffect(() => {
    if (!randomImage) return;

    console.log('[SplashScreen] begin image preload', randomImage);
    const img = new Image();
    img.onload = () => {
      console.log('[SplashScreen] image loaded', randomImage);
      setImageLoaded(true);
    };
    img.onerror = (error) => {
      console.error('[SplashScreen] image failed to load', randomImage, error);
    };
    img.src = randomImage;
  }, [randomImage]);

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-bg-dark overflow-hidden"
    >
      {randomImage && (
        <motion.img
          src={randomImage}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: imageLoaded ? (isExiting ? 0 : 0.72) : 0, scale: isExiting ? 1.04 : 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-white/90 drop-shadow-xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          SoundPillow
        </h1>
      </div>
    </motion.div>
  );
}
