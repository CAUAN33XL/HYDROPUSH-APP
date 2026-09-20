import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface DailyHistoryCardProps {
    currentAmount: number;
    percentage: number;
    isLoading: boolean;
    onReset?: () => void;
}

/**
 * @description Componente de indicador (Card) que exibe o histórico diário de hidratação.
 * Apresenta também parabenização (feedback visual) quando o usuário alcança 100% da meta.
 */
export function DailyHistoryCard({ currentAmount, percentage, isLoading, onReset }: DailyHistoryCardProps) {
    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Histórico do dia</h3>
                {onReset && currentAmount > 0 && (
                    <motion.button
                        onClick={onReset}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileTap={{ scale: 0.95 }}
                    >
                        <RotateCcw size={16} />
                        Resetar
                    </motion.button>
                )}
            </div>

            {currentAmount === 0 ? (
                <motion.div
                    className="text-center py-8 bg-card border border-border rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                >
                    <motion.div
                        className="text-6xl mb-4"
                        layout={false}
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        💧
                    </motion.div>
                    <p className="text-base text-muted-foreground font-medium mb-1">
                        Ainda não registrou hoje
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                        Vamos começar a hidratação?
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                >
                    <motion.div
                        className="flex items-center justify-between p-5 bg-card border border-border rounded-xl shadow-sm hover:shadow-md"
                        initial={{ opacity: 0, y: 15, rotate: 0 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        layout={false}
                        whileHover={{ y: -2 }}
                        transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary text-2xl">💧</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-base text-foreground">Total consumido</p>
                                <p className="text-sm text-muted-foreground">Hoje</p>
                            </div>
                        </div>
                        <motion.span
                            className="text-xl font-bold text-primary"
                            key={currentAmount}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, type: "spring" }}
                        >
                            {currentAmount}ml
                        </motion.span>
                    </motion.div>

                    {percentage >= 100 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center"
                        >
                            <motion.div
                                className="text-3xl mb-3"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: 3
                                }}
                            >
                                🎉
                            </motion.div>
                            <p className="font-bold text-lg text-green-800 dark:text-green-200 mb-1">
                                Meta alcançada!
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Parabéns, você bateu sua meta de hoje!
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
