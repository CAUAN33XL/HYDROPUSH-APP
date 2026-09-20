import React from 'react';

interface TopHeaderProps {
    userName: string;
    dailyGoal: number;
}

/**
 * @description Componente de cabeçalho superior (Top Header).
 * Exibe uma saudação baseada no horário do dia e um resumo rápido da meta diária.
 */
export function TopHeader({ userName, dailyGoal }: TopHeaderProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div className="bg-card border-b border-border px-6 py-4 shrink-0">
            <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
                <div>
                    <p className="text-sm text-muted-foreground">{getGreeting()},</p>
                    <p className="font-semibold text-foreground">{userName}! 👋</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Meta diária</p>
                    <p className="text-sm font-semibold text-primary">
                        {(dailyGoal / 1000).toFixed(1)}L
                    </p>
                </div>
            </div>
        </div>
    );
}
