import { useEffect, useRef } from 'react';

// Base64-encoded 1-second silent MP3 for iOS background audio keepalive.
// iOS suspends audio playback when no active HTMLAudioElement is playing;
// this silent track prevents that suspension while the mixer is active.
const SILENT_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwPExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE////////8AAAAATGF2YzU5LjI3AAAAAAAAAAAAAAAAJAAAAAAAAAAASQAAAAAAAAD/4xQAAAAAAAAAAAAAAAB1VGgAHU0CAAYAAAABOQ1yD+L8qZ/0Z+Z+/0b9+Yf9+f/n//x/+t//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/+v//8//8//w//8//+v//9z/4xQkAAAAXQAAAB1NQQAGAAAAATkNch/P/n5n6N+fM/+jfvzD/vz/8///4//W///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/jFC0AAAA1QAAAHU0CAAYAAAABOQ1yH8/+fmf/+f/r/+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c/+MUMAAAAOgAAAB1NAgAGAAAAATkNcg/P/n5n/0b8+Z/9G/fmH/fn/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/jFCQAAABdAAAAHU1BAAYAAAABOQ1yH8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5/4xQtAAAANwAAAB1NAgAGAAAAATkNcg/P/n5n/0b8+Z/9G/fmH/fn/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/jFDAAAAA6AAAAHU0CAAYAAAABOQ1yD8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//jFCQAAABdAAAAHU1BAAYAAAABOQ1yH8/+fmf/Rvz5n/0b9+Yf9+f/n//H/63//z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5/4xQtAAAANQAAAB1NAgAGAAAAATkNcg/P/n5n//n/6//n/5//x/+t//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c//r///P/+H//h//5//9f//7n/9f//5//w//8P//P//r//9z/+v//8//4f/+H//n//1///uf/1///n//D//w//8//+v//3P/6///z//h//4f/+f//X//+5//X//+f/8P//D//z//6///c/==';

/**
 * Manages a silent audio anchor element for iOS background playback.
 * iOS requires an active HTMLAudioElement to prevent audio suspension
 * when the app is backgrounded. This hook plays/pauses a silent track
 * in sync with the mixer's playing state.
 */
export function useIOSAudioAnchor(isPlaying: boolean) {
  const anchorRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (anchorRef.current) {
        anchorRef.current.pause();
        anchorRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!anchorRef.current) {
      anchorRef.current = new Audio();
      anchorRef.current.loop = true;
      (anchorRef.current as any).playsInline = true;
      anchorRef.current.src = SILENT_MP3;
    }

    if (isPlaying) {
      anchorRef.current.play().catch((err) => {
        console.warn('Failed to play anchor audio:', err);
      });
    } else {
      anchorRef.current.pause();
    }
  }, [isPlaying]);
}
