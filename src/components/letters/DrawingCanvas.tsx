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

const PASS_THRESHOLD = 55;
const SCORE_DEBOUNCE_MS = 1000;
const ADVANCE_DELAY_MS = 1500;
const ALPHA_THRESHOLD = 50;

function prioritizeCharacters(characters: Character[]): Character[] {
  const shuffled = [...characters].sort(() => Math.random() - 0.5);
  return shuffled;
}

function calculateSimilarity(
  drawingCanvas: HTMLCanvasElement,
  referenceCanvas: HTMLCanvasElement,
): number {
  const w = drawingCanvas.width;
  const h = drawingCanvas.height;
  const drawCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
  const refCtx = referenceCanvas.getContext('2d', { willReadFrequently: true });
  if (!drawCtx || !refCtx) return 0;

  const drawData = drawCtx.getImageData(0, 0, w, h).data;
  const refData = refCtx.getImageData(0, 0, w, h).data;

  let overlap = 0;
  let union = 0;

  for (let i = 3; i < drawData.length; i += 4) {
    const drawInk = drawData[i] > ALPHA_THRESHOLD;
    const refInk = refData[i] > ALPHA_THRESHOLD;
    if (drawInk || refInk) {
      union++;
      if (drawInk && refInk) overlap++;
    }
  }

  return union === 0 ? 0 : (overlap / union) * 100;
}

function canvasHasDrawing(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let inkPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > ALPHA_THRESHOLD) inkPixels++;
  }
  // Require a minimum number of ink pixels to consider it a real drawing
  return inkPixels > 20;
}

function renderReferenceChar(canvas: HTMLCanvasElement, char: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.font = `${150 * dpr}px serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

type ScoreResult = { score: number; passed: boolean } | null;

export default function DrawingCanvas({ characters, alphabetName, language, onProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult>(null);
  const [isGraded, setIsGraded] = useState(false);
  const orderedChars = useRef(prioritizeCharacters(characters));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  // Size both canvases and render the reference character
  useEffect(() => {
    const canvas = canvasRef.current;
    const refCanvas = refCanvasRef.current;
    if (!canvas || !refCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    canvas.width = w;
    canvas.height = h;
    refCanvas.width = w;
    refCanvas.height = h;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    clearCanvas();
    renderReferenceChar(refCanvas, current.char);
  }, [clearCanvas, current.char]);

  // Reset score state when character changes
  useEffect(() => {
    setScoreResult(null);
    setIsGraded(false);
  }, [currentIndex]);

  // Cleanup timers on unmount
  useEffect(() => clearTimers, [clearTimers]);

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
    if (isGraded) return;
    e.preventDefault();
    startTimer();
    setIsDrawing(true);

    // Reset debounce timer on new stroke
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

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

  function triggerAutoScore() {
    const canvas = canvasRef.current;
    const refCanvas = refCanvasRef.current;
    if (!canvas || !refCanvas || isGraded) return;

    if (!canvasHasDrawing(canvas)) return;

    const score = Math.round(calculateSimilarity(canvas, refCanvas));
    const passed = score >= PASS_THRESHOLD;
    setScoreResult({ score, passed });

    // Auto-grade and advance
    const id = `${language}/${alphabetName}/${current.char}`;
    updateCharacterProgress(id, language, current.char, current.romanji, passed).then(() => {
      onProgress();
    });
    setIsGraded(true);

    advanceTimerRef.current = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, ADVANCE_DELAY_MS);
  }

  function handleEnd() {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Debounce: score after inactivity to allow multi-stroke characters
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(triggerAutoScore, SCORE_DEBOUNCE_MS);
  }

  function handleCheck() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    triggerAutoScore();
  }

  async function handleManualGrade(correct: boolean) {
    clearTimers();
    setIsGraded(true);
    const id = `${language}/${alphabetName}/${current.char}`;
    await updateCharacterProgress(id, language, current.char, current.romanji, correct);
    onProgress();
    advanceTimerRef.current = setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, ADVANCE_DELAY_MS);
  }

  function handleClear() {
    clearTimers();
    setScoreResult(null);
    setIsGraded(false);
    clearCanvas();
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
        {/* Hidden reference canvas for pixel comparison */}
        <canvas
          ref={refCanvasRef}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Score result banner */}
      {scoreResult && (
        <div
          className={`text-center py-2 rounded-xl font-medium text-sm ${
            scoreResult.passed
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
          }`}
        >
          {scoreResult.passed ? `Great! (${scoreResult.score}%)` : `Try again (${scoreResult.score}%)`}
        </div>
      )}

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
        <div className="flex gap-2">
          {!isGraded && (
            <button
              onClick={handleCheck}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
            >
              Check
            </button>
          )}
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Manual override */}
      {!isGraded && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleManualGrade(false)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors underline"
          >
            Skip
          </button>
          <button
            onClick={() => handleManualGrade(true)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors underline"
          >
            I got it
          </button>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Character {(currentIndex % orderedChars.current.length) + 1} of {orderedChars.current.length}
      </p>
    </div>
  );
}
