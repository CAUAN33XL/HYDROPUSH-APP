import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

const PADS = [
  { key: 'sol', color: 'bg-cyan-400', glow: 'shadow-[0_0_40px_rgba(34,211,238,0.8)]', heavy: 'via-cyan-300' },
  { key: 'agua', color: 'bg-blue-500', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.8)]', heavy: 'via-blue-400' },
  { key: 'vapor', color: 'bg-violet-500', glow: 'shadow-[0_0_40px_rgba(139,92,246,0.8)]', heavy: 'via-violet-400' },
  { key: 'lago', color: 'bg-emerald-400', glow: 'shadow-[0_0_40px_rgba(52,211,153,0.8)]', heavy: 'via-emerald-300' }
];

export function SimonFlow({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'over'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('simon_flow_best') || '0', 10);
  });

  const userIdxRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const saveBest = useCallback((value: number) => {
    setBestScore((prev) => {
      const best = Math.max(prev, value);
      localStorage.setItem('simon_flow_best', best.toString());
      return best;
    });
  }, []);

  const showSequence = useCallback((seq: number[]) => {
    setPhase('showing');
    userIdxRef.current = 0;
    seq.forEach((pad, i) => {
      timersRef.current.push(
        window.setTimeout(() => setActivePad(pad), 500 + i * 650)
      );
      timersRef.current.push(
        window.setTimeout(() => setActivePad(null), 500 + i * 650 + 450)
      );
    });
    timersRef.current.push(
      window.setTimeout(() => setPhase('input'), 500 + seq.length * 650)
    );
  }, []);

  const startGame = () => {
    clearTimers();
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setRound(0);
    setPhase('showing');
    showSequence(first);
  };

  const pressPad = (i: number) => {
    if (phase !== 'input') return;
    setActivePad(i);
    timersRef.current.push(window.setTimeout(() => setActivePad(null), 250));

    if (i === sequence[userIdxRef.current]) {
      userIdxRef.current++;
      if (userIdxRef.current === sequence.length) {
        const next = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(next);
        setRound((r) => r + 1);
        timersRef.current.push(window.setTimeout(() => showSequence(next), 500));
        setPhase('showing');
      }
    } else {
      setPhase('over');
      saveBest(round);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Rodada</div>
          <div className="text-lg font-bold">{round}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Recorde</div>
          <div className="text-lg font-bold text-amber-400">{bestScore}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-sm grid grid-cols-2 gap-4">
          {PADS.map((pad, i) => (
            <motion.button
              key={pad.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => pressPad(i)}
              className={`aspect-square rounded-3xl ${pad.color} ${activePad === i ? pad.glow + ' brightness-150' : 'brightness-75'} transition-all duration-200 border-4 border-white/10`}
            />
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-400 text-center max-w-[280px]">
          {phase === 'idle' && 'Repita a sequência de gotas e flua!'
            || phase === 'showing' && 'Preste atenção na sequência...'
            || phase === 'input' && 'Sua vez! Toque na mesma ordem.'}
        </p>

        {phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Simon Flow</h2>
              <p className="text-slate-300 mb-8 max-w-[260px] mx-auto">Acompanhe a sequência e repita para manter o fluxo!</p>
              <button
                onClick={startGame}
                className="px-10 py-4 bg-emerald-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-5 h-5" /> Começar
              </button>
            </motion.div>
          </div>
        )}

        {phase === 'over' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-red-400 mb-2">Perdeu o Fluxo!</h2>
              <div className="grid grid-cols-2 gap-4 mb-8 mt-6">
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Rodada</p>
                  <p className="text-3xl font-bold">{round}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl">
                  <p className="text-slate-400 text-sm mb-1">Best</p>
                  <p className="text-3xl font-bold text-amber-400">{bestScore}</p>
                </div>
              </div>
              <button
                onClick={startGame}
                className="w-full py-4 bg-emerald-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
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