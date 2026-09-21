import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Target {
  x: number;
  y: number;
  size: number;
  bad: boolean;
  life: number;
}

const DURATION = 30;

export function AquaShot({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('aqua_shot_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const state = useRef({
    targets: [] as Target[],
    frames: 0,
    timeMs: DURATION * 1000,
    lastTick: 0
  });

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setTimeLeft(DURATION);
    state.current = { targets: [], frames: 0, timeMs: DURATION * 1000, lastTick: 0 };
  };

  const shoot = (clientX: number, clientY: number) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const st = state.current;
    let hitIndex = -1;
    let hitDistance = Infinity;
    st.targets.forEach((t, i) => {
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist < t.size + 18 && dist < hitDistance) {
        hitDistance = dist;
        hitIndex = i;
      }
    });

    if (hitIndex >= 0) {
      const t = st.targets[hitIndex];
      st.targets.splice(hitIndex, 1);
      if (t.bad) setScore((s) => s - 5);
      else setScore((s) => s + 10);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = state.current;

      if (isPlaying) {
        const now = performance.now();
        st.frames++;

        if (st.frames % 34 === 0) {
          st.targets.push({
            x: Math.random() * (canvas.width - 80) + 40,
            y: Math.random() * (canvas.height - 160) + 50,
            size: Math.random() * 16 + 16,
            bad: Math.random() < 0.25,
            life: 180
          });
        }

        for (let i = st.targets.length - 1; i >= 0; i--) {
          const t = st.targets[i];
          t.life--;
          if (t.life <= 0) st.targets.splice(i, 1);
        }

        if (st.lastTick === 0) st.lastTick = now;
        st.timeMs -= now - st.lastTick;
        st.lastTick = now;

        const remaining = Math.max(0, Math.ceil(st.timeMs / 1000));
        if (remaining !== timeLeft && remaining >= 0) {
          setTimeLeft(remaining);
        }
        if (st.timeMs <= 0) {
          setIsPlaying(false);
          setIsGameOver(true);
          setBestScore((prev) => {
            const best = Math.max(prev, score);
            localStorage.setItem('aqua_shot_best', best.toString());
            return best;
          });
        }
      } else {
        st.lastTick = 0;
      }

      st.targets.forEach((t) => {
        const pulse = 1 + Math.sin(st.frames * 0.08 + t.x) * 0.08;
        const r = t.size * pulse;
        if (t.bad) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7c2d12';
          ctx.beginPath();
          ctx.arc(t.x - 3, t.y - 3, r / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.arc(t.x - r / 3, t.y - r / 3, r / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, timeLeft, score]);

  return (
    <div
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none"
      onClick={(e) => shoot(e.clientX, e.clientY)}
    >
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full font-bold text-sm ${timeLeft <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10'}`}>
            {timeLeft}s
          </span>
        </div>
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
                className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">Tiro ao Alvo</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Estoure as gotas (+10) e evite o calor (-5) em 30 segundos!</p>
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
              <h2 className="text-2xl font-bold text-sky-400 mb-6">Tempo Esgotado!</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Score</p>
                  <p className="text-3xl font-bold">{score}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Best</p>
                  <p className="text-3xl font-bold text-amber-400">{bestScore}</p>
                </div>
              </div>
              <button
                className="w-full py-4 bg-red-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
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