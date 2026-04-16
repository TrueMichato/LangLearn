import { useRef, useState, useEffect, useCallback } from 'react';
import type { Character } from '../../data/alphabets';
import { updateCharacterProgress } from '../../db/characters';
import { useTimerStore } from '../../stores/timerStore';

interface Props {
  characters: Character[];
  alphabetName: string;
  language: string;
  onProgress: () => void;
}

function prioritizeCharacters(characters: Character[]): Character[] {
  const shuffled = [...characters].sort(() => Math.random() - 0.5);
  return shuffled;
}

export default function DrawingCanvas({ characters, alphabetName, language, onProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const orderedChars = useRef(prioritizeCharacters(characters));
  const timerStart = useTimerStore((s) => s.start);
  const timerIsRunning = useTimerStore((s) => s.isRunning);

  const current = orderedChars.current[currentIndex % orderedChars.current.length];

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide character
    if (showGuide) {
      ctx.save();
      ctx.font = `${150 * dpr}px serif`;
      ctx.fillStyle = 'rgba(180, 180, 180, 0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(current.char, canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }, [showGuide, current.char]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    clearCanvas();
  }, [clearCanvas]);

  function startTimer() {
    if (!hasStartedTimer && !timerIsRunning) {
      timerStart('grammar');
      setHasStartedTimer(true);
    }
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    startTimer();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1f2937';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function handleEnd() {
    setIsDrawing(false);
  }

  async function handleGrade(correct: boolean) {
    const id = `${language}/${alphabetName}/${current.char}`;
    await updateCharacterProgress(id, language, current.char, current.romanji, correct);
    onProgress();
    setCurrentIndex((i) => i + 1);
  }

  return (
    <div className="space-y-3">
      {/* Target character */}
      <div className="text-center">
        <span className="text-6xl">{current.char}</span>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{current.romanji}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{current.strokes} strokes</p>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full aspect-square rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 touch-none cursor-crosshair"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
            className="rounded"
          />
          Show guide
        </label>
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Self-grading */}
      <div className="flex gap-3">
        <button
          onClick={() => handleGrade(false)}
          className="flex-1 py-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
        >
          Try again ✗
        </button>
        <button
          onClick={() => handleGrade(true)}
          className="flex-1 py-3 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium text-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
        >
          Got it ✓
        </button>
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Character {(currentIndex % orderedChars.current.length) + 1} of {orderedChars.current.length}
      </p>
    </div>
  );
}
