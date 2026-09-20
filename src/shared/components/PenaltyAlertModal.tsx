import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from './ui/button';

export interface PenaltyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  penaltyXp: number;
  missedDaysCount: number;
}

export function PenaltyAlertModal({ isOpen, onClose, penaltyXp, missedDaysCount }: PenaltyAlertModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-card border-2 border-red-500/30 rounded-2xl shadow-2xl max-w-md md:max-w-lg mx-auto w-full overflow-hidden text-center"
        >
          <div className="bg-gradient-to-br from-red-500 to-orange-600 p-6 flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
            >
              <AlertTriangle className="w-16 h-16 text-white mb-2" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Atenção Necessária</h2>
          </div>
          
          <div className="p-6">
            <p className="text-foreground mb-4 font-medium text-lg">
              Você negligenciou sua hidratação.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-3 mb-2 text-red-600 dark:text-red-400">
                <TrendingDown className="w-5 h-5" />
                <span className="text-xl font-bold">-{penaltyXp} XP</span>
              </div>
              <p className="text-sm text-red-700/80 dark:text-red-300/80 font-medium">
                Penalidade por {missedDaysCount} {missedDaysCount === 1 ? 'dia consecutivo' : 'dias consecutivos'} de falha.
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              No modo Hardcore, a responsabilidade é toda sua. O aplicativo não enviará notificações, e falhas custam seu progresso. Retome o foco para recuperar seu prestígio.
            </p>
            
            <Button 
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white border-none"
              size="lg"
            >
              Eu assumo a responsabilidade
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
