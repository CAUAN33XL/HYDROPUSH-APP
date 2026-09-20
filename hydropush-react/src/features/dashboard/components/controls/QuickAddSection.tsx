import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

interface QuickAddSectionProps {
    onQuickAdd: (amount: number) => void;
    isLoading: boolean;
}

/**
 * @description Componente de controle (Action/Form).
 * Exibe os botões de atalho rápido de adição de água e o formulário de quantidade personalizada.
 */
export function QuickAddSection({ onQuickAdd, isLoading }: QuickAddSectionProps) {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    const handleCustomAdd = () => {
        if (isLoading) return;

        const amount = parseInt(customAmount);
        if (amount > 0) {
            onQuickAdd(amount);
            setCustomAmount('');
            setShowCustomInput(false);
        }
    };

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
        >
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Adicionar rapidamente
            </h3>

            {/* Grid de 3 colunas para os botões principais */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                    { amount: 100, label: 'Pequeno', sublabel: '100ml', icon: '💧' },
                    { amount: 200, label: 'Médio', sublabel: '200ml', icon: '💦' },
                    { amount: 500, label: 'Grande', sublabel: '500ml', icon: '🌊' },
                ].map((quickAdd, index) => (
                    <motion.button
                        key={quickAdd.amount}
                        onClick={() => onQuickAdd(quickAdd.amount)}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 py-4 px-3 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        whileTap={{ scale: isLoading ? 1 : 0.95 }}
                        whileHover={isLoading ? {} : { y: -2 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.6 + (index * 0.1),
                            duration: 0.4,
                        }}
                    >
                        <motion.div
                            className="text-3xl mb-2"
                            whileHover={isLoading ? {} : { scale: 1.2, rotate: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {quickAdd.icon}
                        </motion.div>
                        <span className="font-semibold text-sm text-foreground text-center leading-tight">
                            {quickAdd.label}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            {quickAdd.sublabel}
                        </span>
                    </motion.button>
                ))}
            </div>

            {/* Botão Personalizar em linha separada */}
            <motion.button
                onClick={() => setShowCustomInput(!showCustomInput)}
                disabled={isLoading}
                className="w-full py-3.5 border-2 border-dashed border-primary/50 text-primary rounded-xl transition-all duration-200 hover:bg-primary/5 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
            >
                <div className="flex items-center justify-center gap-2">
                    <motion.div
                        whileHover={isLoading ? {} : { rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Plus size={20} />
                    </motion.div>
                    <span className="font-semibold">Quantidade Personalizada</span>
                </div>
            </motion.button>

            {/* Input Personalizado */}
            <AnimatePresence>
                {showCustomInput && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full mt-3 overflow-hidden"
                    >
                        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Quantidade personalizada (ml)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="Ex: 300"
                                    className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    min="1"
                                    max="2000"
                                    disabled={isLoading}
                                />
                                <motion.button
                                    onClick={handleCustomAdd}
                                    disabled={!customAmount || parseInt(customAmount) <= 0 || isLoading}
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                                >
                                    Adicionar
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
