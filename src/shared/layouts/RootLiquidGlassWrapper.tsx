import React from 'react';

// Wrapper que ativa globalmente o efeito liquid glass no HTML root
export function RootLiquidGlassWrapper({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        try {
            document.documentElement.classList.add('liquid-glass-enabled');
        } catch {
            // ignore em ambientes sem DOM
        }

        return () => {
            try {
                document.documentElement.classList.remove('liquid-glass-enabled');
            } catch {
                // ignore
            }
        };
    }, []);

    return <div className="min-h-screen bg-background">{children}</div>;
}
