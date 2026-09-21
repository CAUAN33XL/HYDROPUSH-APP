import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Heart } from 'lucide-react';

interface Drop {
  x: number;
  y: number;
  speed: number;
  size: number;
  bad: boolean;
}

export function CataGotas({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('cata_gotas_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const touchX = useRef(window.innerWidth / 2);

  const state = useRef({
    drops: [] as Drop[],
    frames: 0,
    bucketWidth: 90,
    spawnRate: 40
  });

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      touchX.current = e.touches[0].clientX;
    } else {
      touchX.current = (e as React.MouseEvent).clientX;
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    state.current = { drops: [], frames: 0, bucketWidth: 90, spawnRate: 40 };
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
      const bucketX = touchX.current - st.bucketWidth / 2;

      if (isPlaying) {
        st.frames++;

        if (st.frames % st.spawnRate === 0) {
          const bad = Math.random() < 0.15 + score * 0.004;
          st.drops.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -20,
            speed: Math.random() * 3 + 3 + score * 0.05,
            size: bad ? 18 : Math.random() * 8 + 8,
            bad
          });
        }

        const bucketY = canvas.height - 55;

        for (let i = st.drops.length - 1; i >= 0; i--) {
          const d = st.drops[i];
          d.y += d.speed;

          const caught =
            d.y + d.size > bucketY &&
            d.y - d.size < bucketY + 45 &&
            d.x > bucketX - d.size &&
            d.x < bucketX + st.bucketWidth + d.size &&
            d.y > bucketY - 45;

          if (caught) {
            st.drops.splice(i, 1);
            if (d.bad) {
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setIsPlaying(false);
                  setIsGameOver(true);
                  setBestScore((prev) => {
                    const best = Math.max(prev, score);
                    localStorage.setItem('cata_gotas_best', best.toString());
                    return best;
                  });
                }
                return next;
              });
            } else {
              setScore((s) => s + 1);
            }
            continue;
          }

          if (d.y - d.size > canvas.height) {
            st.drops.splice(i, 1);
            if (!d.bad) {
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  setIsPlaying(false);
                  setIsGameOver(true);
                  setBestScore((prev) => {
                    const best = Math.max(prev, score);
                    localStorage.setItem('cata_gotas_best', best.toString());
                    return best;
                  });
                }
                return next;
              });
            }
            continue;
          }

          if (d.bad) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(d.x - 4, d.y - 4, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(d.x - 2, d.y - 2, d.size / 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(bucketX, canvas.height - 55, st.bucketWidth, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.roundRect(bucketX + 5, canvas.height - 60, st.bucketWidth - 10, 8, 4);
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
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onTouchStart={handleMove}
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
                className="w-20 h-20 bg-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(6,182,212,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Cata-Gotas</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Pegue as gotas de água e desvie do calor!</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Fim da Colheita!</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Gotas</p>
                  <p className="text-3xl font-bold">{score}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Best</p>
                  <p className="text-3xl font-bold text-amber-400">{bestScore}</p>
                </div>
              </div>
              <button
                className="w-full py-4 bg-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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