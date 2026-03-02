import { useMemo } from 'react';

interface AmbientParticlesProps {
  count?: number;
  minLeft?: number;
  maxLeft?: number;
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
  maxDelay?: number;
}

export function AmbientParticles({
  count = 6,
  minLeft = 12,
  maxLeft = 88,
  minSize = 4,
  maxSize = 10,
  minDuration = 6,
  maxDuration = 14,
  maxDelay = 6,
}: AmbientParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${minLeft + Math.random() * (maxLeft - minLeft)}%`,
        size: minSize + Math.random() * (maxSize - minSize),
        duration: minDuration + Math.random() * (maxDuration - minDuration),
        delay: Math.random() * maxDelay,
      })),
    [count, minLeft, maxLeft, minSize, maxSize, minDuration, maxDuration, maxDelay],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
