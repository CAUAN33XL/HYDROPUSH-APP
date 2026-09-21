import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Heart } from 'lucide-react';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  row: number;
}

export function QuebraGelo({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('quebra_gelo_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const touchX = useRef(window.innerWidth / 2);
  const gameOverRef = useRef<() => void>(() => {});

  const state = useRef({
    paddle: { x: 0, width: 90, height: 14 },
    ball: { x: 0, y: 0, dx: 3.5, dy: -4, radius: 9, stuck: true },
    bricks: [] as Brick[],
    frames: 0
  });

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      touchX.current = e.touches[0].clientX;
    } else {
      touchX.current = (e as React.MouseEvent).clientX;
    }
  };

  const launch = () => {
    if (isPlaying && state.current.ball.stuck) {
      state.current.ball.stuck = false;
    }
  };

  const buildBricks = (canvasWidth: number, lvl: number) => {
    const cols = 8;
    const rows = Math.min(3 + lvl, 7);
    const brickWidth = (canvasWidth - 50) / cols;
    const brickHeight = 18;
    const bricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: 25 + c * brickWidth + 2,
          y: 80 + r * (brickHeight + 6),
          width: brickWidth - 4,
          height: brickHeight,
          alive: true,
          row: r
        });
      }
    }
    return bricks;
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setLevel(1);
    state.current = {
      paddle: { x: window.innerWidth / 2 - 45, width: 90, height: 14 },
      ball: { x: window.innerWidth / 2, y: 320, dx: 3.5, dy: -4, radius: 9, stuck: true },
      bricks: canvas ? buildBricks(canvas.width, 1) : [],
      frames: 0
    };
  };

  const gameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, score);
      localStorage.setItem('quebra_gelo_best', best.toString());
      return best;
    });
  };

  gameOverRef.current = gameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!state.current.bricks.length) {
      state.current.bricks = buildBricks(canvas.width, 1);
      state.current.paddle.x = window.innerWidth / 2 - 45;
      state.current.ball = { x: window.innerWidth / 2, y: 320, dx: 3.5, dy: -4, radius: 9, stuck: true };
    }

    const render = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = state.current;
      const paddleY = canvas.height - 55;

      st.paddle.x += (touchX.current - st.paddle.width / 2 - st.paddle.x) * 0.3;
      if (st.paddle.x < 0) st.paddle.x = 0;
      if (st.paddle.x + st.paddle.width > canvas.width) {
        st.paddle.x = canvas.width - st.paddle.width;
      }

      if (isPlaying) {
        st.frames++;

        if (st.ball.stuck) {
          st.ball.x = st.paddle.x + st.paddle.width / 2;
          st.ball.y = paddleY - st.ball.radius - 1;
        } else {
          st.ball.x += st.ball.dx;
          st.ball.y += st.ball.dy;

          if (st.ball.x - st.ball.radius < 0 || st.ball.x + st.ball.radius > canvas.width) {
            st.ball.dx *= -1;
          }
          if (st.ball.y - st.ball.radius < 0) {
            st.ball.dy *= -1;
          }

          if (
            st.ball.y + st.ball.radius > paddleY &&
            st.ball.y + st.ball.radius < paddleY + st.paddle.height + 8 &&
            st.ball.x > st.paddle.x &&
            st.ball.x < st.paddle.x + st.paddle.width
          ) {
            st.ball.dy = -Math.abs(st.ball.dy);
            const hitPos = (st.ball.x - (st.paddle.x + st.paddle.width / 2)) / (st.paddle.width / 2);
            st.ball.dx = hitPos * 5;
            st.ball.y = paddleY - st.ball.radius;
          }

          for (const brick of st.bricks) {
            if (!brick.alive) continue;
            const closestX = Math.max(brick.x, Math.min(st.ball.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(st.ball.y, brick.y + brick.height));
            const distX = st.ball.x - closestX;
            const distY = st.ball.y - closestY;
            if (distX * distX + distY * distY < st.ball.radius * st.ball.radius) {
              brick.alive = false;
              setScore((s) => s + brick.width * 2);
              if (Math.abs(distX) > Math.abs(distY)) st.ball.dx *= -1;
              else st.ball.dy *= -1;
              break;
            }
          }

          if (st.ball.y + st.ball.radius > canvas.height) {
            const next = lives - 1;
            if (next <= 0) {
              gameOverRef.current();
            } else {
              setLives(next);
              st.ball.stuck = true;
            }
          }

          const remaining = st.bricks.filter((b) => b.alive).length;
          if (remaining === 0) {
            setLevel((l) => {
              const next = l + 1;
              st.bricks = buildBricks(canvas.width, next);
              st.ball.stuck = true;
              return next;
            });
          }
        }
      }

      st.bricks.forEach((brick) => {
        if (!brick.alive) return;
        const intensity = 0.5 + brick.row * 0.07;
        ctx.fillStyle = `rgba(56, 189, 248, ${intensity})`;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      });

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(st.paddle.x, paddleY, st.paddle.width, st.paddle.height, 6);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(st.ball.x, st.ball.y, st.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(st.ball.x - 3, st.ball.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, score, lives]);

  return (
    <div
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none"
      onMouseMove={handleMove}
      onMouseDown={launch}
      onTouchMove={handleMove}
      onTouchStart={(e) => { handleMove(e); launch(); }}
    >
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Fase {level}</div>
          <div className="flex items-center gap-2 justify-center pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
            ))}
          </div>
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
                className="w-20 h-20 bg-sky-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(56,189,248,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Quebra-Gelo</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Toque na tela para lançar a gota e quebre os blocos de gelo!</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Congelou!</h2>
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
                className="w-full py-4 bg-sky-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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