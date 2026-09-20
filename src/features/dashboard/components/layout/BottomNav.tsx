import React from 'react';
import { motion } from 'motion/react';
import { TabType, NavigationItem } from './Sidebar';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    items: readonly NavigationItem[];
}

/**
 * @description Componente de navegação inferior (Bottom Navigation) utilizado na versão Mobile do aplicativo.
 * Fica fixo na base da tela e gerencia a transição entre abas (tabs).
 */
export function BottomNav({ activeTab, onTabChange, items }: BottomNavProps) {
    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-50 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="flex justify-around py-3 px-2">
                    {items.map(({ id, icon: Icon, label }, index) => (
                        <motion.button
                            key={`mobile-${id}`}
                            onClick={() => onTabChange(id)}
                            className={`flex flex-col items-center gap-1 p-2 relative rounded-xl transition-all duration-300 min-h-[60px] justify-center ${
                                activeTab === id ? 'text-primary' : 'text-muted-foreground'
                            }`}
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.02 }}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                        >
                            {activeTab === id && (
                                <motion.div
                                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-sm"
                                    layoutId="activeTab"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                        duration: 0.3
                                    }}
                                />
                            )}
                            <motion.div
                                className="relative z-20"
                                animate={{
                                    scale: activeTab === id ? 1.1 : 1,
                                    y: activeTab === id ? -2 : 0
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
                            </motion.div>
                            <motion.span
                                className={`text-[10px] relative z-20 leading-tight text-center ${
                                    activeTab === id ? 'font-semibold' : 'font-medium'
                                }`}
                                animate={{
                                    scale: activeTab === id ? 1.05 : 1,
                                    opacity: activeTab === id ? 1 : 0.8
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                {label}
                            </motion.span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
