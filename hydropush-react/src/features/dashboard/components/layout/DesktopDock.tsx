import React from 'react';
import { motion } from 'motion/react';
import { TabType, NavigationItem } from './Sidebar';

interface DesktopDockProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    items: readonly NavigationItem[];
}

/**
 * @description Dock horizontal inferior para a versão Desktop do aplicativo.
 * Inspirado no estilo macOS Dock — ícones centralizados com labels,
 * efeitos de hover e indicador animado da aba ativa.
 * Visível apenas em telas `md:` (768px+).
 */
export function DesktopDock({ activeTab, onTabChange, items }: DesktopDockProps) {
    return (
        <div className="max-md:hidden fixed bottom-0 left-0 w-full z-[999]">
            <motion.div
                className="w-full flex justify-center items-center gap-2 px-4 h-[72px] bg-card/80 backdrop-blur-xl border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >


                {/* Navigation Items */}
                {items.map(({ id, icon: Icon, label }) => (
                    <motion.button
                        key={`dock-${id}`}
                        onClick={() => onTabChange(id)}
                        className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                            activeTab === id
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {activeTab === id && (
                            <motion.div
                                className="absolute inset-0 bg-primary/10 dark:bg-primary/15 rounded-xl"
                                layoutId="desktopDockActive"
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 30,
                                }}
                            />
                        )}
                        <Icon
                            size={18}
                            strokeWidth={activeTab === id ? 2.5 : 2}
                            className="relative z-10"
                        />
                        <span
                            className={`relative z-10 text-sm ${
                                activeTab === id ? 'font-semibold' : 'font-medium'
                            }`}
                        >
                            {label}
                        </span>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
}


