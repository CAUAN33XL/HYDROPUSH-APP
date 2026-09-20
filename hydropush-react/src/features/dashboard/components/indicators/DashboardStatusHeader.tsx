import React from 'react';
import { motion } from 'motion/react';

interface DashboardStatusHeaderProps {
    currentAmount: number;
    dailyGoal: number;
}

/**
 * @description Componente de cabeçalho de status (Indicator).
 * Reage dinamicamente mudando o texto de encorajamento com base na quantidade atual de água bebida.
 */
export function DashboardStatusHeader({ currentAmount, dailyGoal }: DashboardStatusHeaderProps) {
    return (
        <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            {currentAmount === 0 ? (
                <>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Vamos começar o dia! 🌅
                    </h1>
                    <p className="text-base text-muted-foreground mb-4">
                        Sua jornada de hidratação começa agora
                    </p>
                    <motion.div
                        className="max-w-md mx-auto p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <p className="text-base text-blue-800 dark:text-blue-200 font-semibold mb-1">
                            Meta de hoje: {(dailyGoal / 1000).toFixed(1)}L
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Comece com um copo d'água! 💧
                        </p>
                    </motion.div>
                </>
            ) : (
                <>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Continue assim! 💪
                    </h1>
                    <p className="text-base text-muted-foreground">
                        Você está no caminho certo
                    </p>
                </>
            )}
        </motion.div>
    );
}
