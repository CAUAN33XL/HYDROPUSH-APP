import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const SIZE = 4;
const CELLS = SIZE * SIZE;

function createSolved(): number[] {
  return Array.from({ length: CELLS }, (_, i) => (i + 1) % CELLS);
}

function isSolvable(tiles: number[]): boolean {
  const linear = tiles.filter((t) => t !== 0);
  let inversions = 0;
  for (let i = 0; i < linear.length; i++) {
    for (let j = i + 1; j < linear.length; j++) {
      if (linear[i] > linear[j]) inversions++;
    }
  }
  // For 4x4, puzzle solvable if (inversions + blankRow-from-bottom) is even
  const blankRowFromBottom = SIZE - Math.floor(tiles.indexOf(0) / SIZE);
  return (inversions + blankRowFromBottom) % 2 === 0;
}

function shuffleTiles(): number[] {
  let tiles = createSolved();
  do {
    tiles = createSolved();
    for (let i = 0; i < 200; i++) {
      const empty = tiles.indexOf(0);
      const row = Math.floor(empty / SIZE);
      const col = empty % SIZE;
      const neighbors: number[] = [];
      if (row > 0) neighbors.push(empty - SIZE);
      if (row < SIZE - 1) neighbors.push(empty + SIZE);
      if (col > 0) neighbors.push(empty - 1);
      if (col < SIZE - 1) neighbors.push(empty + 1);
      const target = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[empty], tiles[target]] = [tiles[target], tiles[empty]];
    }
  } while (!isSolvable(tiles) || tiles.join(',') === createSolved().join(','));

  return tiles;
}

export function HydroSlide({ onExit }: { onExit: () => void }) {
  const [tiles, setTiles] = useState<number[]>(shuffleTiles);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('hydro_slide_best') || '999', 10);
  });

  const solved = tiles.join(',') === createSolved().join(',');

  const handleMove = useCallback((index: number, current: number[]) => {
    const empty = current.indexOf(0);
    const tileRow = Math.floor(index / SIZE);
    const tileCol = index % SIZE;
    const emptyRow = Math.floor(empty / SIZE);
    const emptyCol = empty % SIZE;

    if (
      (tileRow === emptyRow && Math.abs(tileCol - emptyCol) === 1) ||
      (tileCol === emptyCol && Math.abs(tileRow - emptyRow) === 1)
    ) {
      const next = [...current];
      [next[empty], next[index]] = [next[index], next[empty]];
      setTiles(next);
      setMoves((m) => m + 1);
    }
  }, []);

  if (solved && !won) {
    setWon(true);
    setBestScore((prev) => {
      const best = Math.min(prev, moves);
      localStorage.setItem('hydro_slide_best', best.toString());
      return best;
    });
  }

  const resetGame = () => {
    setTiles(shuffleTiles());
    setMoves(0);
    setWon(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Queda Deslizante</div>
          <div className="text-lg font-bold">Movimentos: {moves}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Recorde</div>
          <div className="text-lg font-bold text-amber-400">{bestScore}</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="grid grid-cols-4 gap-2 w-full max-w-sm bg-slate-800/50 p-2 rounded-2xl border border-slate-700">
          {tiles.map((tile, i) => (
            <motion.button
              key={i}
              layout
              onClick={() => (won ? null : handleMove(i, tiles))}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-black transition-colors ${
                tile === 0
                  ? 'bg-transparent border-2 border-dashed border-slate-700'
                  : tile === i + 1
                    ? 'bg-sky-500/40 border-2 border-sky-400/40'
                    : 'bg-sky-500 border-2 border-sky-400'
              }`}
            >
              {tile !== 0 && <span>{tile}</span>}
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
              <h2 className="text-2xl font-bold text-sky-400 mb-2">Resolvido!</h2>
              <p className="text-slate-300 mb-4">Você ordenou em {moves} movimentos</p>
              <p className="text-sm text-amber-400 mb-6">Recorde: {bestScore} movimentos</p>
              <button
                onClick={resetGame}
                className="w-full py-4 bg-sky-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5" /> Embaralhar de Novo
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}