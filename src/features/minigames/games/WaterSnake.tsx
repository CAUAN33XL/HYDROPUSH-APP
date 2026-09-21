import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Pt {
  x: number;
  y: number;
}

const CELL = 16;

export function WaterSnake({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('water_snake_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const dirRef = useRef<Pt>({ x: 1, y: 0 });
  const nextDirRef = useRef<Pt>({ x: 1, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const state = useRef({
    cols: 0,
    rows: 0,
    snake: [] as Pt[],
    food: { x: 5, y: 5 },
    frames: 0,
    stepEvery: 9
  });

  const gameOverRef = useRef<() => void>(() => {});
  gameOverRef.current = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, score);
      localStorage.setItem('water_snake_best', best.toString());
      return best;
    });
  };

  const resetGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor(canvas.height / CELL);
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    state.current = {
      cols,
      rows,
      snake: [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
      ],
      food: { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) },
      frames: 0,
      stepEvery: 9
    };
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
  };

  const setDirection = (d: Pt) => {
    const current = dirRef.current;
    if (d.x === -current.x && d.y === -current.y) return;
    if (d.x === current.x && d.y === current.y) return;
    nextDirRef.current = d;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setDirection({ x: 0, y: -1 });
      if (e.key === 'ArrowDown') setDirection({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft') setDirection({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') setDirection({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const st = state.current;

      if (isPlaying) {
        st.frames++;

        if (st.frames % st.stepEvery === 0) {
          dirRef.current = nextDirRef.current;
          const head = st.snake[0];
          const nh = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

          const hitWall = nh.x < 0 || nh.y < 0 || nh.x >= st.cols || nh.y >= st.rows;
          const hitSelf = st.snake.some((p, i) => i < st.snake.length - 1 && p.x === nh.x && p.y === nh.y);

          if (hitWall || hitSelf) {
            gameOverRef.current();
          } else {
            st.snake.unshift(nh);
            if (nh.x === st.food.x && nh.y === st.food.y) {
              setScore((s) => {
                const next = s + 1;
                if (next % 3 === 0 && st.stepEvery > 4) st.stepEvery--;
                return next;
              });
              st.food = {
                x: Math.floor(Math.random() * st.cols),
                y: Math.floor(Math.random() * st.rows)
              };
            } else {
              st.snake.pop();
            }
          }
        }
      }

      st.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#34d399' : '#0ea5e9';
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      });

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(st.food.x * CELL + CELL / 2, st.food.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(st.food.x * CELL + CELL / 2 - 2, st.food.y * CELL + CELL / 2 - 2, CELL / 7, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, score]);

  return (
    <div
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <p className="text-xs text-slate-400">Use as setas ou deslize para mover</p>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-sm text-slate-400">Best: {bestScore}</div>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="w-full h-full block"
        />

        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div
                className="w-20 h-20 bg-emerald-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(52,211,153,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Cobra D'Água</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Colete as gotas para crescer sem bater nas paredes!</p>
            </motion.div>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-red-400 mb-6">Secou o lago!</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Pontos</p>
                  <p className="text-3xl font-bold">{score}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Best</p>
                  <p className="text-3xl font-bold text-amber-400">{bestScore}</p>
                </div>
              </div>
              <button
                className="w-full py-4 bg-emerald-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
              >
                <RotateCcw className="w-5 h-5" /> Tentar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}