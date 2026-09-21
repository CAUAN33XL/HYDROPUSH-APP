import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'barrier' | 'sun';
  passed: boolean;
}

export function DropDash({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('drop_dash_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const gameOverRef = useRef<() => void>(() => {});
  gameOverRef.current = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, score);
      localStorage.setItem('drop_dash_best', best.toString());
      return best;
    });
  };

  const state = useRef({
    drop: { x: 90, y: 0, velY: 0, size: 18 },
    groundY: 0,
    obstacles: [] as Obstacle[],
    frames: 0,
    speed: 5.5,
    jumpPower: -15
  });

  const jump = () => {
    if (!isPlaying && !isGameOver) {
      setIsPlaying(true);
      return;
    }
    if (isPlaying) {
      state.current.drop.velY = state.current.jumpPower;
    }
    if (isGameOver) {
      resetGame();
    }
  };

  const resetGame = () => {
    const canvas = canvasRef.current;
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    state.current = {
      drop: { x: 90, y: 0, velY: 0, size: 18 },
      groundY: canvas ? canvas.height - 80 : 0,
      obstacles: [],
      frames: 0,
      speed: 5.5,
      jumpPower: -15
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const st = state.current;
    st.groundY = canvas.height - 80;
    st.drop.y = st.groundY - st.drop.size;

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sky gradient hint
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#0c4a6e');
      sky.addColorStop(1, '#0f172a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        st.frames++;

        if (st.frames % 60 === 0) st.speed += 0.3;
        if (st.frames % 96 === 0) {
          const type: 'barrier' | 'sun' = Math.random() < 0.3 ? 'sun' : 'barrier';
          const height = type === 'sun' ? 34 : 26 + Math.random() * 30;
          st.obstacles.push({
            x: canvas.width + 30,
            width: type === 'sun' ? 34 : 22,
            height,
            type,
            passed: false
          });
        }

        st.drop.velY += 0.7;
        st.drop.y += st.drop.velY;
        if (st.drop.y >= st.groundY - st.drop.size) {
          st.drop.y = st.groundY - st.drop.size;
          st.drop.velY = 0;
        }

        for (let i = st.obstacles.length - 1; i >= 0; i--) {
          const o = st.obstacles[i];
          o.x -= st.speed;

          // Collision
          const overlap =
            st.drop.x + st.drop.size > o.x &&
            st.drop.x - st.drop.size < o.x + o.width &&
            st.drop.y + st.drop.size > st.groundY - o.height;

          if (overlap) {
            gameOverRef.current();
          }

          if (o.x + o.width < st.drop.x - st.drop.size && !o.passed) {
            o.passed = true;
            setScore((s) => s + 1);
          }

          if (o.x + o.width < 0) {
            st.obstacles.splice(i, 1);
          }
        }
      }

      // Draw ground
      ctx.fillStyle = '#075985';
      ctx.fillRect(0, st.groundY, canvas.width, canvas.height - st.groundY);
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(0, st.groundY, canvas.width, 4);

      st.obstacles.forEach((o) => {
        if (o.type === 'sun') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(o.x + o.width / 2, st.groundY - o.height / 2, o.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(o.x + o.width / 2, st.groundY - o.height / 2, o.width / 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(o.x, st.groundY - o.height, o.width, o.height);
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(o.x + 3, st.groundY - o.height + 4, o.width - 6, 6);
        }
      });

      // Draw drop
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(st.drop.x, st.drop.y - st.drop.size);
      ctx.quadraticCurveTo(st.drop.x + st.drop.size, st.drop.y, st.drop.x, st.drop.y + st.drop.size);
      ctx.quadraticCurveTo(st.drop.x - st.drop.size, st.drop.y, st.drop.x, st.drop.y - st.drop.size);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(st.drop.x - 4, st.drop.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, score]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none" onClick={jump}>
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-sm text-slate-400">Best: {bestScore}</div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
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
              <div className="w-20 h-20 bg-amber-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Gota Corredora</h2>
              <p className="text-slate-300">Toque para pular e fugir do calor!</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Evaporou!</h2>
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
                className="w-full py-4 bg-amber-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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