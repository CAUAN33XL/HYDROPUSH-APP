import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

export function WaterPong({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('water_pong_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Player state
  const playerRef = useRef({ x: window.innerWidth / 2 - 40, width: 80, height: 15 });
  const touchX = useRef(window.innerWidth / 2);
  
  // Game state
  const state = useRef({
    ball: { x: window.innerWidth / 2, y: window.innerHeight / 2, dx: 4, dy: -4, radius: 10 },
    drops: [] as { x: number, y: number, speed: number, size: number }[],
    frames: 0
  });

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    state.current = {
      ball: { x: window.innerWidth / 2, y: window.innerHeight / 2, dx: 4, dy: -4, radius: 10 },
      drops: [],
      frames: 0
    };
  };

  const gameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('water_pong_best', score.toString());
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      touchX.current = e.touches[0].clientX;
    } else {
      touchX.current = (e as React.MouseEvent).clientX;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = state.current;
      const player = playerRef.current;

      // Update player position based on touch (smoothly)
      player.x += (touchX.current - player.width / 2 - player.x) * 0.3;
      
      // Boundaries for player
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

      if (isPlaying) {
        st.frames++;
        
        // Move ball
        st.ball.x += st.ball.dx;
        st.ball.y += st.ball.dy;

        // Wall collisions
        if (st.ball.x - st.ball.radius < 0 || st.ball.x + st.ball.radius > canvas.width) {
          st.ball.dx *= -1;
        }
        if (st.ball.y - st.ball.radius < 0) {
          st.ball.dy *= -1;
        }

        // Floor collision (Game Over)
        if (st.ball.y + st.ball.radius > canvas.height) {
          gameOver();
        }

        const playerY = canvas.height - 100;

        // Paddle collision
        if (
          st.ball.y + st.ball.radius > playerY &&
          st.ball.y - st.ball.radius < playerY + player.height &&
          st.ball.x > player.x &&
          st.ball.x < player.x + player.width
        ) {
          st.ball.dy *= -1;
          
          // Add some english/spin
          const hitPos = (st.ball.x - (player.x + player.width / 2)) / (player.width / 2);
          st.ball.dx = hitPos * 5;
          
          // Increase speed slightly
          if (Math.abs(st.ball.dy) < 12) {
             st.ball.dy *= 1.05;
          }

          setScore(s => s + 1);
        }

        // Rain drops (Visuals only)
        if (st.frames % 10 === 0) {
           st.drops.push({
             x: Math.random() * canvas.width,
             y: -20,
             speed: Math.random() * 3 + 2,
             size: Math.random() * 2 + 1
           });
        }
      }

      // Draw Rain
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // blue-500 with opacity
      for (let i = st.drops.length - 1; i >= 0; i--) {
        const d = st.drops[i];
        d.y += d.speed;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();

        if (d.y > canvas.height) {
          st.drops.splice(i, 1);
        }
      }

      // Draw Paddle
      const playerY = canvas.height - 100;
      ctx.fillStyle = '#06b6d4'; // cyan-500
      ctx.beginPath();
      ctx.roundRect(player.x, playerY, player.width, player.height, 8);
      ctx.fill();

      // Draw Ball (Drop)
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.beginPath();
      ctx.arc(st.ball.x, st.ball.y, st.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(st.ball.x - 3, st.ball.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver]);

  return (
    <div 
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none" 
      onMouseMove={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
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
                className="w-20 h-20 bg-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(6,182,212,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Water Pong</h2>
              <p className="text-slate-300 max-w-[250px] mx-auto">Deslize o dedo na tela para não deixar a gota cair!</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Caiu!</h2>
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
