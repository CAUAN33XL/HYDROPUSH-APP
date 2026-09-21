import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

const DURATION = 30;

export function TocaGotas({ onExit }: { onExit: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [isBad, setIsBad] = useState(false);
  const [hitFlash, setHitFlash] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('toca_gotas_best') || '0', 10);
  });

  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef(950);

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = window.setInterval(() => {
      const hole = Math.floor(Math.random() * 9);
      const bad = Math.random() < 0.2;
      setActiveHole(hole);
      setIsBad(bad);
      setTimeout(() => {
        setActiveHole((current) => (current === hole ? null : current));
      }, speedRef.current);
      if (speedRef.current > 500) speedRef.current -= 20;
    }, speedRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          setIsPlaying(false);
          setIsGameOver(true);
          setBestScore((prev) => {
            const best = Math.max(prev, score);
            localStorage.setItem('toca_gotas_best', best.toString());
            return best;
          });
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const whack = (hole: number) => {
    if (!isPlaying) return;
    setHitFlash(hole);
    setTimeout(() => setHitFlash(null), 180);

    if (activeHole === hole) {
      if (isBad) {
        setScore((s) => Math.max(0, s - 3));
      } else {
        setScore((s) => s + 1);
      }
      setActiveHole(null);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(DURATION);
    setActiveHole(null);
    setIsBad(false);
    speedRef.current = 950;
    setIsPlaying(true);
    setIsGameOver(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Tempo</div>
          <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-400' : ''}`}>{timeLeft}s</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Recorde</div>
          <div className="text-lg font-bold text-amber-400">{bestScore}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="text-4xl font-black text-white mb-5">{score}</div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => whack(i)}
              whileTap={{ scale: 0.9 }}
              className={`aspect-square rounded-2xl border-4 flex items-end justify-center overflow-hidden transition-all ${
                hitFlash === i
                  ? 'border-sky-300 bg-sky-500/30'
                  : 'border-slate-700 bg-slate-800/60'
              }`}
            >
              <div className={`relative w-full h-full flex items-end justify-center ${activeHole === i ? '' : 'pointer-events-none'}`}>
                {activeHole === i && (
                  <motion.div
                    initial={{ y: 60, scale: 1.4 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 60, scale: 1.4 }}
                    className={`w-16 h-16 rounded-full mb-2 ${isBad ? 'bg-orange-500' : 'bg-sky-400'} flex items-center justify-center`}
                  >
                    {isBad ? (
                      <span className="text-xl font-black text-orange-900">!</span>
                    ) : (
                      <span className="w-5 h-5 bg-white/40 rounded-full self-start mt-2" />
                    )}
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <p className="mt-5 text-xs text-slate-400">Bata nas gotas de água e evite o calor!</p>

        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="w-20 h-20 bg-lime-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(163,230,53,0.5)]">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-green-400">Toca-a-Gota</h2>
              <p className="text-slate-300 mb-8 max-w-[250px] mx-auto">Bata nas gotas que surgem (+1) e evite o sol (-3) por 30 segundos!</p>
              <button onClick={startGame} className="px-10 py-4 bg-lime-400 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
                Começar
              </button>
            </motion.div>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-lime-400 mb-2">Tempo Esgotado!</h2>
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
              <button onClick={startGame} className="w-full py-4 bg-lime-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <RotateCcw className="w-5 h-5" /> Tentar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}