import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Heart } from 'lucide-react';

interface Bubble {
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
}

interface PopEffect {
  x: number;
  y: number;
  size: number;
  life: number;
}

export function AquaPop({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('aqua_pop_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const state = useRef({
    bubbles: [] as Bubble[],
    pops: [] as PopEffect[],
    frames: 0,
    spawnRate: 30
  });

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, score);
      localStorage.setItem('aqua_pop_best', best.toString());
      return best;
    });
  };

  const endGameRef = useRef<() => void>(() => {});
  endGameRef.current = endGame;

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    state.current = { bubbles: [], pops: [], frames: 0, spawnRate: 30 };
  };

  const popAt = (clientX: number, clientY: number) => {
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

    st.bubbles.forEach((b, i) => {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < b.size + 25 && dist < hitDistance) {
        hitDistance = dist;
        hitIndex = i;
      }
    });

    if (hitIndex >= 0) {
      const b = st.bubbles[hitIndex];
      st.pops.push({ x: b.x, y: b.y, size: b.size, life: 20 });
      st.bubbles.splice(hitIndex, 1);
      setScore((s) => s + 1);
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
        st.frames++;

        if (st.frames % st.spawnRate === 0) {
          st.bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            speed: Math.random() * 1.5 + 1.2,
            size: Math.random() * 22 + 14,
            hue: Math.random() * 360
          });
        }

        if (st.spawnRate > 14 && st.frames % 90 === 0) {
          st.spawnRate--;
        }

        for (let i = st.bubbles.length - 1; i >= 0; i--) {
          const b = st.bubbles[i];
          b.y -= b.speed;

          if (b.y + b.size < 0) {
            st.bubbles.splice(i, 1);
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) endGameRef.current();
              return next;
            });
          }
        }
      }

      st.bubbles.forEach((b) => {
        ctx.strokeStyle = `hsla(${b.hue}, 80%, 70%, 0.9)`;
        ctx.fillStyle = `hsla(${b.hue}, 70%, 50%, 0.2)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = `hsla(${b.hue}, 90%, 80%, 0.8)`;
        ctx.beginPath();
        ctx.arc(b.x - b.size / 3, b.y - b.size / 3, b.size / 4, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = st.pops.length - 1; i >= 0; i--) {
        const p = st.pops[i];
        p.life--;
        const alpha = p.life / 20;
        ctx.strokeStyle = `rgba(103, 232, 249, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - (1 - alpha)), 0, Math.PI * 2);
        ctx.stroke();
        if (p.life <= 0) st.pops.splice(i, 1);
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, score]);

  return (
    <div
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none"
      onClick={(e) => popAt(e.clientX, e.clientY)}
    >
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
          ))}
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
                className="w-20 h-20 bg-rose-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(244,63,94,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">Estoura Bolhas</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Estoure todas as bolhas antes que escapem para o céu!</p>
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
              <h2 className="text-2xl font-bold text-rose-400 mb-6">Bolhas Escaparam!</h2>
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
                className="w-full py-4 bg-rose-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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