import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Trophy } from 'lucide-react';

const ROWS = 9;
const COLS = 9;
const LEVELS = 5;

type Grid = string[][];

function generateMaze(): Grid {
  const grid: Grid = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const visited = new Set<string>();

  const carve = (r: number, c: number) => {
    grid[r][c] = '.';
    visited.add(`${r},${c}`);
    const dirs = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0]
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && !visited.has(`${nr},${nc}`)) {
        grid[r + dr / 2][c + dc / 2] = '.';
        carve(nr, nc);
      }
    }
  };

  carve(1, 1);
  grid[1][1] = 'S';
  grid[ROWS - 2][COLS - 2] = 'G';
  return grid;
}

export function LabirintoGota({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'win'>('idle');
  const [grid, setGrid] = useState<Grid>(generateMaze);
  const [player, setPlayer] = useState({ y: 1, x: 1 });
  const [level, setLevel] = useState(1);
  const [totalMoves, setTotalMoves] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('labirinto_gota_best') || '999', 10);
  });

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const state = useRef({ won: false });
  state.current.won = phase === 'win';

  const nextLevel = useCallback(() => {
    if (level >= LEVELS) {
      setPhase('win');
      setBestScore((prev) => {
        const best = Math.min(prev, totalMoves);
        localStorage.setItem('labirinto_gota_best', best.toString());
        return best;
      });
    } else {
      setTimeout(() => {
        setGrid(generateMaze());
        setPlayer({ y: 1, x: 1 });
        setLevel((l) => l + 1);
      }, 250);
    }
  }, [level, totalMoves]);

  useEffect(() => {
    if (player.y === ROWS - 2 && player.x === COLS - 2 && phase === 'playing') {
      nextLevel();
    }
  }, [player, phase, nextLevel]);

  const move = (dy: number, dx: number) => {
    if (phase !== 'playing' || state.current.won) return;
    const ny = player.y + dy;
    const nx = player.x + dx;
    if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) return;
    if (grid[ny][nx] === '#') return;
    setPlayer({ y: ny, x: nx });
    setTotalMoves((m) => m + 1);
  };

  const startGame = () => {
    setGrid(generateMaze());
    setPlayer({ y: 1, x: 1 });
    setLevel(1);
    setTotalMoves(0);
    setPhase('playing');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move(-1, 0);
      if (e.key === 'ArrowDown') move(1, 0);
      if (e.key === 'ArrowLeft') move(0, -1);
      if (e.key === 'ArrowRight') move(0, 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1);
    else move(dy > 0 ? 1 : -1, 0);
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
          <div className="text-sm text-slate-400">Labirinto da Gota</div>
          <div className="text-lg font-bold">{phase === 'playing' ? `Fase ${level}/${LEVELS}` : 'Pronto?'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Movimentos</div>
          <div className="text-lg font-bold text-amber-400">{totalMoves}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div
          className="grid gap-0.5 bg-slate-800/40 p-2 rounded-2xl border border-slate-700"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, width: 'min(90vw, 390px)' }}
        >
          {grid.flat().map((cell, i) => {
            const index = { y: Math.floor(i / COLS), x: i % COLS };
            const isPlayer = player.y === index.y && player.x === index.x;
            let bg = 'bg-slate-800/20';
            if (cell === '#') bg = 'bg-slate-700';
            if (cell === 'G') bg = 'bg-emerald-400/30';
            if (cell === 'S') bg = 'bg-sky-500/30';
            if (isPlayer) bg = 'bg-sky-400';
            return (
              <div key={i} className={`aspect-square rounded-sm ${bg} flex items-center justify-center text-[10px]`}>
                {cell === 'G' && <span className="text-emerald-300">✧</span>}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400">Arraste ou use as setas para levar a gota ao objetivo ✧</p>

        {phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="w-20 h-20 bg-teal-400 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(45,212,191,0.5)]">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">Labirinto da Gota</h2>
              <p className="text-slate-300 mb-8 max-w-[250px] mx-auto">Conduza a gota até o destino em {LEVELS} fases com o mínimo de movimentos!</p>
              <button onClick={startGame} className="px-10 py-4 bg-teal-400 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
                Começar
              </button>
            </motion.div>
          </div>
        )}

        {phase === 'win' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-teal-400 mb-2">Todas as fases!</h2>
              <p className="text-slate-300 mb-6">Você completou em {totalMoves} movimentos</p>
              <p className="text-sm text-amber-400 mb-6">Recorde: {bestScore} movimentos</p>
              <button onClick={startGame} className="w-full py-4 bg-teal-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <RotateCcw className="w-5 h-5" /> Jogar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}