import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Enemy {
  x: number;
  y: number;
  size: number;
  vy: number;
}

export function AstroGota({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('astro_gota_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const touchX = useRef(window.innerWidth / 2);

  const state = useRef({
    shipX: 0,
    shipW: 46,
    bullets: [] as { x: number; y: number }[],
    enemies: [] as Enemy[],
    frames: 0,
    fireEvery: 20
  });

  const gameOverRef = useRef<() => void>(() => {});
  gameOverRef.current = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, score);
      localStorage.setItem('astro_gota_best', best.toString());
      return best;
    });
  };

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
    state.current = {
      shipX: 0,
      shipW: 46,
      bullets: [],
      enemies: [],
      frames: 0,
      fireEvery: 20
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(1, '#0f172a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % canvas.width;
        const sy = (i * 73.2) % canvas.height;
        ctx.fillStyle = `rgba(255,255,255,${0.2 + ((i * 13) % 50) / 100})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      const st = state.current;
      st.shipX += (touchX.current - st.shipW / 2 - st.shipX) * 0.35;
      if (st.shipX < 0) st.shipX = 0;
      if (st.shipX + st.shipW > canvas.width) st.shipX = canvas.width - st.shipW;

      const shipY = canvas.height - 70;

      if (isPlaying) {
        st.frames++;

        if (st.frames % st.fireEvery === 0) {
          st.bullets.push({ x: st.shipX + st.shipW / 2, y: shipY - 12 });
        }

        if (st.frames % 55 === 0) {
          const waveY = st.enemies.length === 0 ? -30 : Math.min(...st.enemies.map((e) => e.y));
          if (waveY > 60) {
            const count = 3 + Math.floor(score / 8);
            for (let i = 0; i < count; i++) {
              st.enemies.push({
                x: (Math.random() * canvas.width) / 1.2 + 20,
                y: -30 - Math.random() * 20,
                size: 16 + Math.random() * 6,
                vy: 0.6 + score * 0.02
              });
            }
          }
        }

        for (let i = st.bullets.length - 1; i >= 0; i--) {
          const b = st.bullets[i];
          b.y -= 7;
          if (b.y < 0) {
            st.bullets.splice(i, 1);
            continue;
          }
          let hit = false;
          for (let j = st.enemies.length - 1; j >= 0; j--) {
            const e = st.enemies[j];
            if (
              b.x > e.x - e.size &&
              b.x < e.x + e.size &&
              b.y > e.y - e.size &&
              b.y < e.y + e.size
            ) {
              st.enemies.splice(j, 1);
              setScore((s) => s + 1);
              hit = true;
              break;
            }
          }
          if (hit) st.bullets.splice(i, 1);
        }

        for (let i = st.enemies.length - 1; i >= 0; i--) {
          const e = st.enemies[i];
          e.y += e.vy;
          if (e.y > shipY) {
            gameOverRef.current();
          }
        }
      }

      st.bullets.forEach((b) => {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.roundRect(b.x - 2, b.y - 10, 4, 14, 2);
        ctx.fill();
      });

      st.enemies.forEach((e) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.arc(e.x - 4, e.y - 4, e.size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x + 5, e.y + 3, e.size / 5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.moveTo(st.shipX + st.shipW / 2, shipY);
      ctx.lineTo(st.shipX, shipY + 16);
      ctx.lineTo(st.shipX + st.shipW, shipY + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#a5b4fc';
      ctx.beginPath();
      ctx.roundRect(st.shipX + st.shipW / 2 - 4, shipY - 4, 8, 8, 2);
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
                className="w-20 h-20 bg-fuchsia-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(217,70,239,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Astro Gota</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Mova a gota para desintegrar o sol antes que ele te evapore!</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Órbita Perdida!</h2>
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
                className="w-full py-4 bg-fuchsia-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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