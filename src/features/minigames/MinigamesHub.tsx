import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Lock,
  AlertTriangle,
  Droplets,
  Trophy,
  Sparkles,
  Grid3x3,
  CloudRain,
  Blend,
  HelpCircle,
  Snowflake,
  Zap,
  Waves,
  Rocket,
  ListMusic,
  Layers,
  Crosshair,
  Hammer,
  Music4,
  Compass
} from 'lucide-react';
import { storageService, UserStats } from '../../core/services/StorageService';

// Import Games
import { FlappyDrop } from './games/FlappyDrop';
import { WaterPong } from './games/WaterPong';
import { AquaMemory } from './games/AquaMemory';
import { HydroSlide } from './games/HydroSlide';
import { CataGotas } from './games/CataGotas';
import { AquaPop } from './games/AquaPop';
import { AquaQuiz } from './games/AquaQuiz';
import { QuebraGelo } from './games/QuebraGelo';
import { DropDash } from './games/DropDash';
import { WaterSnake } from './games/WaterSnake';
import { AstroGota } from './games/AstroGota';
import { SimonFlow } from './games/SimonFlow';
import { MergeDrops } from './games/MergeDrops';
import { AquaShot } from './games/AquaShot';
import { TocaGotas } from './games/TocaGotas';
import { RitmoChuva } from './games/RitmoChuva';
import { LabirintoGota } from './games/LabirintoGota';

interface MinigameDef {
  id: string;
  name: string;
  description: string;
  requiredAchievementId: string;
  requiredAchievementName: string;
  color: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<{ onExit: () => void }>;
}

const MINIGAMES: MinigameDef[] = [
  {
    id: 'flappy-drop',
    name: 'Flappy Drop',
    description: 'Voe entre os canos e não deixe a gota secar!',
    requiredAchievementId: 'silver_streak',
    requiredAchievementName: 'Sequência Prata (7 Dias)',
    color: 'from-blue-400 to-cyan-500',
    icon: Droplets,
    component: FlappyDrop
  },
  {
    id: 'water-pong',
    name: 'Water Pong',
    description: 'O clássico Pong, mas protegendo sua hidratação.',
    requiredAchievementId: 'month_champion',
    requiredAchievementName: 'Campeão do Mês',
    color: 'from-purple-500 to-pink-500',
    icon: Gamepad2,
    component: WaterPong
  },
  {
    id: 'aqua-memory',
    name: 'Memória Aqua',
    description: 'Encontre os pares de gotas com o mínimo de jogadas.',
    requiredAchievementId: 'first_drop',
    requiredAchievementName: 'Primeira Gota',
    color: 'from-cyan-400 to-teal-500',
    icon: Sparkles,
    component: AquaMemory
  },
  {
    id: 'hydro-slide',
    name: 'Queda Deslizante',
    description: 'Ordene os blocos no clássico quebra-cabeça de 15.',
    requiredAchievementId: 'first_drop',
    requiredAchievementName: 'Primeira Gota',
    color: 'from-teal-500 to-emerald-500',
    icon: Grid3x3,
    component: HydroSlide
  },
  {
    id: 'cata-gotas',
    name: 'Cata-Gotas',
    description: 'Pegue as gotas que caem do céu e desvie do calor.',
    requiredAchievementId: 'water_warrior',
    requiredAchievementName: 'Guerreiro da Água',
    color: 'from-sky-400 to-blue-600',
    icon: CloudRain,
    component: CataGotas
  },
  {
    id: 'aqua-pop',
    name: 'Estoura Bolhas',
    description: 'Estoure as bolhas antes que escapem para o céu.',
    requiredAchievementId: 'water_warrior',
    requiredAchievementName: 'Guerreiro da Água',
    color: 'from-rose-400 to-orange-400',
    icon: Blend,
    component: AquaPop
  },
  {
    id: 'aqua-quiz',
    name: 'Quiz da Hidratação',
    description: 'Teste seus conhecimentos sobre água e saúde.',
    requiredAchievementId: 'hydration_hero',
    requiredAchievementName: 'Herói da Hidratação',
    color: 'from-violet-500 to-purple-500',
    icon: HelpCircle,
    component: AquaQuiz
  },
  {
    id: 'quebra-gelo',
    name: 'Quebra-Gelo',
    description: 'Quebre os blocos de gelo com sua gota elástica.',
    requiredAchievementId: 'bronze_streak',
    requiredAchievementName: 'Sequência Bronze (3 Dias)',
    color: 'from-blue-500 to-indigo-500',
    icon: Snowflake,
    component: QuebraGelo
  },
  {
    id: 'labirinto-gota',
    name: 'Labirinto da Gota',
    description: 'Leve a gota ao destino em fases cada vez mais difíceis.',
    requiredAchievementId: 'silver_streak',
    requiredAchievementName: 'Sequência Prata (7 Dias)',
    color: 'from-teal-500 to-cyan-600',
    icon: Compass,
    component: LabirintoGota
  },
  {
    id: 'drop-dash',
    name: 'Gota Corredora',
    description: 'Corra desviando do calor sem evaporar.',
    requiredAchievementId: 'gold_streak',
    requiredAchievementName: 'Sequência Ouro (14 Dias)',
    color: 'from-amber-400 to-orange-500',
    icon: Zap,
    component: DropDash
  },
  {
    id: 'water-snake',
    name: "Cobra D'Água",
    description: 'Cresça coletando gotas sem bater nas paredes.',
    requiredAchievementId: 'emerald_master',
    requiredAchievementName: 'Mestre Esmeralda (21 Dias)',
    color: 'from-emerald-400 to-teal-600',
    icon: Waves,
    component: WaterSnake
  },
  {
    id: 'astro-gota',
    name: 'Astro Gota',
    description: 'Defenda sua órbita contra a chuva de estrelas quentes.',
    requiredAchievementId: 'diamond_legend',
    requiredAchievementName: 'Lenda Diamante (30 Dias)',
    color: 'from-fuchsia-500 to-purple-600',
    icon: Rocket,
    component: AstroGota
  },
  {
    id: 'simon-flow',
    name: 'Simon Flow',
    description: 'Repita a sequência de luzes sem perder o fluxo.',
    requiredAchievementId: 'perfect_week',
    requiredAchievementName: 'Semana Perfeita',
    color: 'from-indigo-400 to-blue-600',
    icon: ListMusic,
    component: SimonFlow
  },
  {
    id: 'merge-drops',
    name: 'Fusão de Gotas',
    description: 'Deslize e funda as gotas até a cristalização final.',
    requiredAchievementId: 'month_champion',
    requiredAchievementName: 'Campeão do Mês',
    color: 'from-cyan-500 to-blue-600',
    icon: Layers,
    component: MergeDrops
  },
  {
    id: 'aqua-shot',
    name: 'Tiro ao Alvo',
    description: 'Estoure gotas (+10) e evite o calor (-5) contra o relógio.',
    requiredAchievementId: 'hydration_veteran',
    requiredAchievementName: 'Veterano da Hidratação (50 Dias)',
    color: 'from-red-500 to-rose-500',
    icon: Crosshair,
    component: AquaShot
  },
  {
    id: 'toca-gotas',
    name: 'Toca-a-Gota',
    description: 'Bata nas gotas que surgem e esquive do sol.',
    requiredAchievementId: 'hydration_master',
    requiredAchievementName: 'Mestre da Hidratação (100 Dias)',
    color: 'from-lime-500 to-green-600',
    icon: Hammer,
    component: TocaGotas
  },
  {
    id: 'ritmo-chuva',
    name: 'Ritmo da Chuva',
    description: 'Toque no ritmo certo e faça chover pontos.',
    requiredAchievementId: 'consistency_king',
    requiredAchievementName: 'Rei da Consistência',
    color: 'from-violet-400 to-fuchsia-500',
    icon: Music4,
    component: RitmoChuva
  }
];

export function MinigamesHub() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [unlockedGames, setUnlockedGames] = useState<string[]>([]);
  const [penaltyXp, setPenaltyXp] = useState(0);

  useEffect(() => {
    const loadStats = () => {
      const userStats = storageService.loadUserStats();
      setStats(userStats);
      setPenaltyXp(userStats.totalPenaltyXp || 0);

      // Modo Deus: acesso a todos os jogos
      const godMode = storageService.isGodModeEnabled();

      // Check unlocks based on stats (matching AchievementSystem logic)
      const unlocks = [];
      if (godMode) {
        MINIGAMES.forEach((g) => unlocks.push(g.id));
      }
      if (userStats.currentStreak >= 7) unlocks.push('flappy-drop');
      if (userStats.monthlyGoalsAchieved >= 30) unlocks.push('water-pong');
      if (userStats.totalGoalsAchieved >= 1) unlocks.push('aqua-memory', 'hydro-slide');
      if (userStats.totalGoalsAchieved >= 5) unlocks.push('cata-gotas', 'aqua-pop');
      if (userStats.totalGoalsAchieved >= 15) unlocks.push('aqua-quiz');
      if (userStats.currentStreak >= 3) unlocks.push('quebra-gelo');
      if (userStats.currentStreak >= 7) unlocks.push('labirinto-gota');
      if (userStats.currentStreak >= 14) unlocks.push('drop-dash');
      if (userStats.currentStreak >= 21) unlocks.push('water-snake');
      if (userStats.currentStreak >= 30) unlocks.push('astro-gota');
      if (userStats.perfectDays >= 7) unlocks.push('simon-flow');
      if (userStats.monthlyGoalsAchieved >= 30) unlocks.push('merge-drops');
      if (userStats.totalDaysTracked >= 50) unlocks.push('aqua-shot');
      if (userStats.totalDaysTracked >= 100) unlocks.push('toca-gotas');
      if (userStats.averageCompletion >= 90 && userStats.totalDaysTracked >= 30) unlocks.push('ritmo-chuva');
      setUnlockedGames(Array.from(new Set(unlocks)));
    };

    loadStats();

    // Listen to penalty events
    const unsub = storageService.subscribe('user_stats', (value: any) => {
      if (value) {
        setPenaltyXp(value.totalPenaltyXp || 0);
      }
    });

    return () => unsub();
  }, []);

  if (!stats) return null;

  const godMode = storageService.isGodModeEnabled();
  const isLockedOut = penaltyXp > 0 && !godMode;

  // Renderização de um minigame ativo
  if (activeGame) {
    const GameComponent = MINIGAMES.find(g => g.id === activeGame)?.component;
    if (GameComponent) {
      return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <GameComponent onExit={() => setActiveGame(null)} />
        </div>
      );
    }
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Fliperama</h2>
          <p className="text-muted-foreground text-sm">Suas recompensas de consistência</p>
        </div>
      </div>

      <AnimatePresence>
        {isLockedOut ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-500 mb-2">Acesso Bloqueado!</h3>
            <p className="text-foreground/80 mb-4">
              Você perdeu sua frequência de hidratação e acumulou <strong className="text-red-500">{penaltyXp} XP de Penalidade</strong>.
            </p>
            <div className="bg-background/50 rounded-xl p-4 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 inline-block mr-2 -mt-1" />
              Bata sua meta diária de água hoje para abater 100 XP da sua dívida e recuperar o acesso aos minigames.
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {MINIGAMES.map((game, index) => {
              const isUnlocked = unlockedGames.includes(game.id);
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => isUnlocked ? setActiveGame(game.id) : null}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                    isUnlocked 
                      ? 'border-transparent cursor-pointer hover:scale-[1.02] shadow-lg' 
                      : 'border-border/50 bg-muted/30 cursor-not-allowed grayscale-[0.5]'
                  }`}
                >
                  {isUnlocked && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10`} />
                  )}
                  
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                      isUnlocked ? `bg-gradient-to-br ${game.color} text-white` : 'bg-muted text-muted-foreground'
                    }`}>
                      <game.icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold text-lg ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {game.name}
                        </h4>
                        {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {game.description}
                      </p>

                      {!isUnlocked && (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 py-1.5 px-3 rounded-full w-fit">
                          <Trophy className="w-3.5 h-3.5" />
                          Requer: {game.requiredAchievementName}
                        </div>
                      )}
                      
                      {isUnlocked && (
                        <div className="text-xs font-bold text-primary uppercase tracking-wider">
                          Toque para Jogar
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
