import { type ReactNode } from 'react';

interface FlipCardProps {
  isFlipped: boolean;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

export default function FlipCard({ isFlipped, front, back, className = '' }: FlipCardProps) {
  return (
    <div className={`flip-container ${className}`}>
      <div className={`flip-card relative w-full ${isFlipped ? 'flipped' : ''}`}>
        {/* Front face */}
        <div className="flip-face w-full">
          {front}
        </div>
        {/* Back face — absolutely positioned on top, rotated 180° by default */}
        <div className="flip-face flip-back absolute inset-0 w-full">
          {back}
        </div>
      </div>
    </div>
  );
}
