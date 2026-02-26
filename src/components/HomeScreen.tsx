import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Play,
  Layers,
  Trees,
  PawPrint,
  Wind,
  Sparkles,
  Heart,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TRACKS, CATEGORIES, DEFAULT_MIXES } from '../constants';
import { Track, MixPreset } from '../types';
import { useAppContext } from '../context/AppContext';

interface HomeScreenProps {
  onTrackSelect: (track: Track) => void;
  onMixSelect: (preset: MixPreset) => void;
}

export function HomeScreen({ onTrackSelect, onMixSelect }: HomeScreenProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const { isFavorite, toggleFavorite, showFavoritesOnly, setMenuOpen, setCurrentScreen } = useAppContext();

  const filteredTracks = TRACKS.filter((track) => {
    // Category filter
    if (activeCategory !== 'all' && track.category.toLowerCase() !== activeCategory) {
      return false;
    }
    // Favorites filter
    if (showFavoritesOnly && !isFavorite(track.id)) {
      return false;
    }
    return true;
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    Trees: <Trees size={18} />,
    PawPrint: <PawPrint size={18} />,
    Wind: <Wind size={18} />,
    Sparkles: <Sparkles size={18} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto pt-8 pb-24 space-y-8 no-scrollbar"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6">
        <button onClick={() => setMenuOpen(true)} className="text-slate-100">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">SoundPillow</h1>
        <button className="text-primary">
          <Moon size={24} fill="currentColor" />
        </button>
      </header>

      {/* Categories — scrolls edge-to-edge */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-slate-800/50 text-slate-300'
            }`}
          >
            {categoryIcons[cat.icon]}
            <span className="text-sm font-semibold">{cat.name}</span>
          </button>
        ))}
      </div>

      {showFavoritesOnly && (
        <div className="flex items-center gap-2 px-6">
          <Heart size={16} className="text-primary" fill="currentColor" />
          <span className="text-sm font-semibold text-primary">Showing Favorites</span>
        </div>
      )}

      {/* Relaxing Mix — pre-built mixes, scrolls edge-to-edge */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-lg font-bold">Relaxing Mix</h2>
          <button
            onClick={() => { setCurrentScreen('mixer'); }}
            className="text-primary text-sm font-semibold"
          >
            Create Mix
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-6">
          {DEFAULT_MIXES.map((mix) => {
            const mixTracks = mix.tracks
              .map((mt) => TRACKS.find((t) => t.id === mt.trackId))
              .filter(Boolean) as Track[];
            const coverTrack = mixTracks[0];

            return (
              <div
                key={mix.id}
                onClick={() => onMixSelect(mix)}
                className="relative min-w-[280px] h-48 rounded-3xl overflow-hidden group cursor-pointer"
              >
                {/* Dual-image cover: blend first two track images */}
                <div className="absolute inset-0 flex">
                  {mixTracks.slice(0, 2).map((t, i) => (
                    <img
                      key={t.id}
                      src={t.imageUrl}
                      alt={t.title}
                      className={`h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                        mixTracks.length >= 2 ? 'w-1/2' : 'w-full'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1">
                  <Layers size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-white/80">{mix.tracks.length} sounds</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{mix.name}</h3>
                    <p className="text-xs text-slate-300">
                      {mixTracks.map((t) => t.title).join(' + ')}
                    </p>
                  </div>
                  <div className="bg-primary p-2 rounded-full shadow-lg">
                    <Play size={20} fill="white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Sleep */}
      {filteredTracks.length > 0 && (
        <section className="space-y-4 px-6">
          <h2 className="text-lg font-bold">Quick Sleep</h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className="glass-panel p-3 rounded-3xl space-y-3 cursor-pointer hover:bg-primary/5 transition-colors relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="absolute top-5 right-5 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                >
                  <Heart
                    size={14}
                    className={isFavorite(track.id) ? 'text-primary' : 'text-white/60'}
                    fill={isFavorite(track.id) ? 'currentColor' : 'none'}
                  />
                </button>
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{track.title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
