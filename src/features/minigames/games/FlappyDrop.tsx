import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

export function FlappyDrop({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('flappy_drop_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game state
  const state = useRef({
    drop: { y: 250, velocity: 0, gravity: 0.6, jump: -8 },
    pipes: [] as { x: number, y: number, width: number, height: number, passed: boolean }[],
    frames: 0,
    gap: 150
  });

  const jump = () => {
    if (!isPlaying && !isGameOver) {
      setIsPlaying(true);
    }
    if (isPlaying) {
      state.current.drop.velocity = state.current.drop.jump;
    }
    if (isGameOver) {
      resetGame();
    }
  };

  const resetGame = () => {
    state.current = {
      drop: { y: 250, velocity: 0, gravity: 0.6, jump: -8 },
      pipes: [],
      frames: 0,
      gap: 150
    };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const gameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('flappy_drop_best', score.toString());
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

      if (isPlaying) {
        st.drop.velocity += st.drop.gravity;
        st.drop.y += st.drop.velocity;
        st.frames++;

        // Add pipes
        if (st.frames % 90 === 0) {
          const pipeY = Math.random() * (canvas.height - st.gap - 100) + 50;
          st.pipes.push({
            x: canvas.width,
            y: pipeY,
            width: 60,
            height: canvas.height,
            passed: false
          });
        }

        // Update and draw pipes
        for (let i = st.pipes.length - 1; i >= 0; i--) {
          const p = st.pipes[i];
          p.x -= 3;

          // Draw top pipe
          ctx.fillStyle = '#10b981'; // emerald-500
          ctx.fillRect(p.x, 0, p.width, p.y);
          
          // Draw bottom pipe
          ctx.fillRect(p.x, p.y + st.gap, p.width, canvas.height - p.y - st.gap);

          // Collision detection
          const dropSize = 15;
          const dropX = 100;
          
          if (
            dropX + dropSize > p.x &&
            dropX - dropSize < p.x + p.width &&
            (st.drop.y - dropSize < p.y || st.drop.y + dropSize > p.y + st.gap)
          ) {
            gameOver();
          }

          // Floor/Ceiling collision
          if (st.drop.y + dropSize > canvas.height || st.drop.y - dropSize < 0) {
            gameOver();
          }

          // Score update
          if (p.x + p.width < dropX && !p.passed) {
            setScore(s => s + 1);
            p.passed = true;
          }

          // Remove off-screen pipes
          if (p.x + p.width < 0) {
            st.pipes.splice(i, 1);
          }
        }
      } else {
        // Draw static pipes if not playing
        st.pipes.forEach(p => {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(p.x, 0, p.width, p.y);
          ctx.fillRect(p.x, p.y + st.gap, p.width, canvas.height - p.y - st.gap);
        });
      }

      // Draw drop (player)
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.beginPath();
      ctx.arc(100, st.drop.y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Little highlight on drop
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(95, st.drop.y - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white" onClick={jump}>
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
              <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Flappy Drop</h2>
              <p className="text-slate-300">Toque na tela para nadar</p>
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
              <h2 className="text-2xl font-bold text-red-400 mb-6">Secou!</h2>
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
                className="w-full py-4 bg-blue-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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
