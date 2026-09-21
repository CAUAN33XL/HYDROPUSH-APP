import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];

interface Card {
  id: number;
  color: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  COLORS.forEach((color, i) => {
    deck.push({ id: i * 2, color, flipped: false, matched: false });
    deck.push({ id: i * 2 + 1, color, flipped: false, matched: false });
  });
  return deck.sort(() => Math.random() - 0.5);
}

export function AquaMemory({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [firstOpen, setFirstOpen] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('aqua_memory_best') || '999', 10);
  });

  useEffect(() => {
    if (pairsMatched === COLORS.length) {
      setWon(true);
      setBestScore((prev) => {
        const best = Math.min(prev, moves);
        localStorage.setItem('aqua_memory_best', best.toString());
        return best;
      });
    }
  }, [pairsMatched, moves]);

  const flipCard = (index: number) => {
    if (won || cards[index].flipped || cards[index].matched) return;

    const updated = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    setCards(updated);

    if (firstOpen === null) {
      setFirstOpen(index);
    } else {
      const a = cards[firstOpen];
      const b = updated[index];
      setMoves((m) => m + 1);

      if (a.color === b.color) {
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstOpen || i === index ? { ...c, matched: true, flipped: true } : c
          )
        );
        setPairsMatched((p) => p + 1);
        setFirstOpen(null);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstOpen || i === index ? { ...c, flipped: false } : c
            )
          );
        }, 750);
        setFirstOpen(null);
      }
    }
  };

  const resetGame = () => {
    setCards(buildDeck());
    setFirstOpen(null);
    setMoves(0);
    setPairsMatched(0);
    setWon(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Memória Aqua</div>
          <div className="text-lg font-bold">Jogadas: {moves}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Pares</div>
          <div className="text-lg font-bold text-amber-400">{pairsMatched}/{COLORS.length}</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {cards.map((card, i) => (
            <motion.button
              key={card.id}
              onClick={() => flipCard(i)}
              whileTap={{ scale: 0.92 }}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-colors ${
                card.matched
                  ? 'border-emerald-400/60 bg-emerald-500/20'
                  : card.flipped
                    ? 'border-white/20 bg-white/10'
                    : 'border-sky-400/30 bg-sky-500/10 active:bg-sky-500/20'
              }`}
            >
              {card.flipped || card.matched ? (
                <span className="w-7 h-7 rounded-full" style={{ backgroundColor: card.color }} />
              ) : (
                <span className="text-sky-300/50">?</span>
              )}
            </motion.button>
          ))}
        </div>

        {won && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Todas as gotas!</h2>
              <p className="text-slate-300 mb-4">Você completou em {moves} jogadas</p>
              <p className="text-sm text-amber-400 mb-6">Recorde: {bestScore} jogadas</p>
              <button
                onClick={resetGame}
                className="w-full py-4 bg-sky-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5" /> Jogar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}