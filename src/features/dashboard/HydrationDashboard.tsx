import React, { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { WaterGlass, DashboardStatusHeader, DailyHistoryCard } from './components/indicators';
import { QuickAddSection } from './components/controls';
import { DESIGN_TOKENS } from '../../constants/designTokens';

interface HydrationData {
  currentAmount: number;
  dailyGoal: number;
  userName: string;
}

export interface HydrationDashboardProps {
  data: HydrationData;
  onAddDrink: (amount: number) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export function HydrationDashboard({ data, onAddDrink, onReset, isLoading = false }: HydrationDashboardProps) {

  const [lastAddedAmount, setLastAddedAmount] = useState(0);
  const [showUndo, setShowUndo] = useState(false);

  const percentage = Math.min(Math.round((data.currentAmount / data.dailyGoal) * 100), 100);

  const handleQuickAdd = (amount: number) => {
    if (isLoading) return;

    onAddDrink(amount);
    setLastAddedAmount(amount);

    setShowUndo(true);
    setTimeout(() => setShowUndo(false), DESIGN_TOKENS.UI.UNDO_BUTTON_TIMEOUT);

    // Toast sutil confirmando adição
    toast.success(`+${amount}ml adicionados`, {
      duration: 2000,
    });

    // navigator.vibrate?.(50); // REMOVIDO: Evitar vibração fantasma
  };

  const handleUndo = () => {
    if (isLoading) return;

    if (lastAddedAmount > 0) {
      onAddDrink(-lastAddedAmount);
      setLastAddedAmount(0);
      setShowUndo(false);
      // navigator.vibrate?.(100); // REMOVIDO: Evitar vibração fantasma
    }
  };


  const handleReset = () => {
    if (isLoading || !onReset) return;

    onReset();
    setShowUndo(false);
    setLastAddedAmount(0);
  };

  return (
    <div className="relative w-full min-h-full flex flex-col p-4 md:p-8">
      <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-2 md:gap-8 items-center my-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </motion.div>
        )}

        {/* Coluna da Esquerda: Copo D'água */}
        <div className="flex flex-col items-center justify-center space-y-4 md:space-y-8 order-first md:order-1">
          <motion.div
            className="flex items-center justify-center py-2 md:py-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <WaterGlass
              currentAmount={data.currentAmount}
              dailyGoal={data.dailyGoal}
              size="lg"
              animated={true}
            />
          </motion.div>

          {/* Botão Desfazer - Centralizado */}
          {showUndo && (
            <div className="h-12 flex items-center justify-center w-full">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button
                  onClick={handleUndo}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-5 py-2.5 rounded-full border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Undo2 size={18} />
                  <span className="text-sm font-medium">Desfazer (+{lastAddedAmount}ml)</span>
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Status e Ações */}
        <div className="flex flex-col justify-center space-y-6 md:space-y-8 order-last md:order-2 px-2 md:px-0">
          <DashboardStatusHeader 
            currentAmount={data.currentAmount} 
            dailyGoal={data.dailyGoal} 
          />
          
          <QuickAddSection 
            onQuickAdd={handleQuickAdd} 
            isLoading={isLoading} 
          />
          
          <DailyHistoryCard 
            currentAmount={data.currentAmount}
            percentage={percentage}
            isLoading={isLoading}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}