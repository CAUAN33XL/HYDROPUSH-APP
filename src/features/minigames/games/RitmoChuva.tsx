import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

const TOTAL_NOTES = 40;
const LANES = 4;

interface Note {
  lane: number;
  hitAt: number;
  resolved: boolean;
  hit: boolean;
}

export function RitmoChuva({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [todo, setTodo] = useState(TOTAL_NOTES);
  const [judge, setJudge] = useState<{ label: string; color: string; key: number } | null>(null);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('ritmo_chuva_best') || '0', 10);
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const state = useRef({
    notes: [] as Note[],
    spawnIndex: 0,
    startedAt: 0,
    hitY: 0,
    speed: 0.32,
    resolvedCount: 0,
    ended: false
  });

  const spawnTimerRef = useRef<number | null>(null);

  const endGame = (finalScore: number) => {
    if (state.current.ended) return;
    state.current.ended = true;
    setIsPlaying(false);
    setIsGameOver(true);
    setBestScore((prev) => {
      const best = Math.max(prev, finalScore);
      localStorage.setItem('ritmo_chuva_best', best.toString());
      return best;
    });
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setScore(0);
    setCombo(0);
    setJudge(null);
    state.current = {
      notes: [],
      spawnIndex: 0,
      startedAt: 0,
      hitY: canvas.height - 130,
      speed: 0.32,
      resolvedCount: 0,
      ended: false
    };
    setTodo(TOTAL_NOTES);
    setIsPlaying(true);
    setIsGameOver(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    state.current.startedAt = performance.now();

    spawnTimerRef.current = window.setInterval(() => {
      const st = state.current;
      st.spawnIndex++;
      st.notes.push({
        lane: Math.floor(Math.random() * LANES),
        hitAt: performance.now() + 1700,
        resolved: false,
        hit: false
      });
      if (st.spawnIndex >= TOTAL_NOTES && spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    }, 470);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [isPlaying]);

  const tapLane = (lane: number) => {
    if (!isPlaying) return;
    const st = state.current;
    const now = performance.now();

    let best: Note | null = null;
    let bestDelta = Infinity;
    for (const n of st.notes) {
      if (n.resolved || n.lane !== lane) continue;
      const delta = Math.abs(now - n.hitAt);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = n;
      }
    }

    if (!best) {
      setCombo((c) => (c > 0 ? c - 1 : 0));
      return;
    }

    best.resolved = true;
    best.hit = true;
    st.resolvedCount++;

    let gained = 0;
    let label = '';
    let color = '';
    if (bestDelta < 70) {
      gained = 100;
      label = 'PERFEITO';
      color = 'text-amber-300';
    } else if (bestDelta < 160) {
      gained = 60;
      label = 'BOA';
      color = 'text-emerald-300';
    } else {
      gained = 10;
      label = 'QUASE';
      color = 'text-slate-300';
    }

    setScore((s) => s + gained);
    setCombo((c) => (bestDelta < 160 ? c + 1 : 0));
    setTodo((t) => t - 1);
    setJudge({ label, color, key: Date.now() });
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
      const laneWidth = canvas.width / LANES;
      const now = performance.now();

      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(139, 92, 246, 0.08)';
        ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);
      }

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, st.hitY);
      ctx.lineTo(canvas.width, st.hitY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
      ctx.fillRect(0, st.hitY, canvas.width, 4);

      if (isPlaying) {
        for (const n of st.notes) {
          if (n.resolved) continue;

          const dy = (n.hitAt - now) * st.speed;
          const y = st.hitY - dy;

          if (y < -40) {
            n.resolved = true;
            n.hit = false;
            st.resolvedCount++;
            setCombo(0);
            setTodo((t) => t - 1);
            continue;
          }

          const x = n.lane * laneWidth + laneWidth / 2;
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(94, 234, 212, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 21, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (st.resolvedCount >= TOTAL_NOTES) {
          const finalScore = score;
          endGame(finalScore);
        }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, score]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden touch-none">
      <div className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Combo {combo}x</div>
          <div className="text-xs text-slate-500">Restante: {todo}</div>
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

        <div className="absolute left-0 right-0 grid" style={{ gridTemplateColumns: `repeat(${LANES}, 1fr)`, top: 0, bottom: 0 }}>
          {Array.from({ length: LANES }).map((_, i) => (
            <button
              key={i}
              onClick={() => tapLane(i)}
              className="w-full h-full"
              style={{ backgroundColor: 'transparent' }}
            />
          ))}
        </div>

        {judge && isPlaying && (
          <div className="absolute inset-x-0 top-16 flex justify-center pointer-events-none">
            <motion.div
              key={judge.key}
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1.2, y: 0 }}
              className={`text-3xl font-black ${judge.color}`}
            >
              {judge.label}
            </motion.div>
          </div>
        )}

        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div
                className="w-20 h-20 bg-violet-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(167,139,250,0.5)] pointer-events-auto cursor-pointer"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Ritmo da Chuva</h2>
              <p className="text-slate-300 max-w-[260px] mx-auto">Toque na faixa quando a gota chegar na linha e faça chover pontos!</p>
            </motion.div>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-violet-400 mb-2">Que chuva!</h2>
              <div className="grid grid-cols-2 gap-4 mb-8 mt-6">
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
                className="w-full py-4 bg-violet-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
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