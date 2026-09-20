import React from 'react';
import { Droplets, LucideIcon } from 'lucide-react';

export type TabType = 'home' | 'stats' | 'history' | 'profile' | 'settings';

export interface NavigationItem {
    id: TabType;
    icon: LucideIcon;
    label: string;
}

interface SidebarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    items: readonly NavigationItem[];
}

/**
 * @description Componente de barra lateral (Sidebar) utilizado na versão Desktop do aplicativo.
 * Responsável por gerenciar a navegação principal entre as abas do painel.
 */
export function Sidebar({ activeTab, onTabChange, items }: SidebarProps) {
    return (
        <div className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 shrink-0">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Droplets size={24} className="text-primary" />
                </div>
                <span className="font-bold text-lg text-foreground">Hydropush</span>
            </div>

            <div className="flex flex-col gap-2">
                {items.map(({ id, icon: Icon, label }) => (
                    <button
                        key={`desktop-${id}`}
                        onClick={() => onTabChange(id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                            activeTab === id
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-muted/50 font-medium'
                        }`}
                    >
                        <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
