import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, MoveUp, MoveDown, MoveLeft, MoveRight } from 'lucide-react';

type Board = number[][];

const SIZE = 4;
const EMPTY: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const TILE_COLORS: Record<number, string> = {
  0: 'bg-slate-800/60',
  2: 'bg-sky-950 text-sky-300 border border-sky-500/30',
  4: 'bg-sky-900 text-sky-200 border border-sky-400/30',
  8: 'bg-sky-700 text-white border border-sky-400/50',
  16: 'bg-blue-700 text-white border border-blue-400/50',
  32: 'bg-indigo-600 text-white border border-indigo-300/50',
  64: 'bg-violet-600 text-white border border-violet-300/50',
  128: 'bg-fuchsia-600 text-white border border-fuchsia-300/50',
  256: 'bg-cyan-600 text-white border border-cyan-300/50',
  512: 'bg-teal-500 text-white border border-teal-300/50',
  1024: 'bg-emerald-500 text-white border border-emerald-200/50',
  2048: 'bg-emerald-400 text-slate-900 border border-emerald-200/60'
};

function clone(b: Board): Board {
  return b.map((row) => [...row]);
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      out.push(filtered[i] * 2);
      gained += filtered[i] * 2;
      i++;
    } else {
      out.push(filtered[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

function rotate(b: Board): Board {
  const n = b.length;
  const out = clone(b);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out[j][n - 1 - i] = b[i][j];
    }
  }
  return out;
}

function moveLeft(b: Board): { board: Board; gained: number } {
  let gained = 0;
  const next = b.map((row) => {
    const r = slideRow(row);
    gained += r.gained;
    return r.row;
  });
  return { board: next, gained };
}

function spawnTile(board: Board): Board {
  const empty: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === 0) empty.push([r, c]);
    })
  );
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = clone(board);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function makeMove(board: Board, dir: 'left' | 'right' | 'up' | 'down') {
  let current = clone(board);
  if (dir === 'right') current = rotate(rotate(current));
  else if (dir === 'up') current = rotate(current);
  else if (dir === 'down') current = rotate(rotate(rotate(current)));

  const { board: slided, gained } = moveLeft(current);

  if (dir === 'right') return { board: rotate(rotate(slided)), gained };
  if (dir === 'up') return { board: rotate(rotate(rotate(slided))), gained };
  if (dir === 'down') return { board: rotate(slided), gained };
  return { board: slided, gained };
}

function hasMoves(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c];
      if (v === 0) return true;
      if (c + 1 < SIZE && board[r][c + 1] === v) return true;
      if (r + 1 < SIZE && board[r + 1][c] === v) return true;
    }
  }
  return false;
}

export function MergeDrops({ onExit }: { onExit: () => void }) {
  const [board, setBoard] = useState<Board>(EMPTY);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('merge_drops_best') || '0', 10);
  });
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<Board>(EMPTY);
  const scoreRef = useRef(0);
  const bestRef = useRef(
    parseInt(localStorage.getItem('merge_drops_best') || '0', 10)
  );

  const startGame = useCallback(() => {
    const initial = spawnTile(spawnTile(EMPTY));
    boardRef.current = initial;
    scoreRef.current = 0;
    setBoard(initial);
    setScore(0);
    setMoves(0);
    setOver(false);
  }, []);

  const doMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    const { board: next, gained } = makeMove(boardRef.current, dir);
    const changed = JSON.stringify(next) !== JSON.stringify(boardRef.current);
    if (!changed) return;
    const finalBoard = spawnTile(next);
    boardRef.current = finalBoard;
    setBoard(finalBoard);
    setMoves((m) => m + 1);
    const ns = scoreRef.current + gained;
    scoreRef.current = ns;
    setScore(ns);
    if (ns > bestRef.current) {
      bestRef.current = ns;
      setBestScore(ns);
      localStorage.setItem('merge_drops_best', ns.toString());
    }
    if (!hasMoves(finalBoard)) setOver(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') doMove('left');
      if (e.key === 'ArrowRight') doMove('right');
      if (e.key === 'ArrowUp') doMove('up');
      if (e.key === 'ArrowDown') doMove('down');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
    touchRef.current = null;
  };

  return (
    <div
      className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Fusão de Gotas</div>
          <div className="text-lg font-bold">{score}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Recorde</div>
          <div className="text-lg font-bold text-amber-400">{bestScore}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-700 w-full max-w-sm grid grid-cols-4 gap-2 aspect-square">
          {board.flat().map((v, i) => (
            <motion.div
              key={i}
              animate={{ scale: [0.9, 1] }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl flex items-center justify-center text-2xl font-black ${TILE_COLORS[v] || TILE_COLORS[2048]}`}
            >
              {v !== 0 ? v : ''}
            </motion.div>
          ))}
        </div>

        <p className="mt-5 text-xs text-slate-400">Deslize ou use as setas para fundir as gotas</p>

        <div className="flex gap-2 mt-4">
          <div className="flex flex-col gap-2 items-center">
            <button onClick={() => doMove('up')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"><MoveUp className="w-6 h-6" /></button>
            <div className="flex gap-2">
              <button onClick={() => doMove('left')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"><MoveLeft className="w-6 h-6" /></button>
              <button onClick={() => doMove('right')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"><MoveRight className="w-6 h-6" /></button>
            </div>
            <button onClick={() => doMove('down')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"><MoveDown className="w-6 h-6" /></button>
          </div>
        </div>

        {moves === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pointer-events-none">
              <button onClick={startGame} className="px-10 py-4 bg-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform">
                <Play className="w-5 h-5" /> Começar
              </button>
            </motion.div>
          </div>
        )}

        {over && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">Sem espaço na garrafa!</h2>
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
              <button onClick={startGame} className="w-full py-4 bg-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <RotateCcw className="w-5 h-5" /> Jogar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}