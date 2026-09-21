import React, { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { storageService } from '../../core/services/StorageService';

interface DebugPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
    const [activeTab, setActiveTab] = useState<'storage' | 'system'>('storage');
    const [storageInfo, setStorageInfo] = useState<any>(null);

    useEffect(() => {
        const loadDebugInfo = () => {
            if (activeTab === 'storage') {
                const info = (storageService as any).estimateStorageUsage?.() || { bytes: 0, items: 0 };
                setStorageInfo(info);
            }
        };

        if (isOpen) {
            loadDebugInfo();
        }
    }, [isOpen, activeTab]);

    const clearAllData = async () => {
        if (confirm('⚠️ Isso vai limpar TODOS os dados do app. Continuar?')) {
            await storageService.clearAllData();
            alert('Dados limpos! Recarregue a página.');
        }
    };

    const resetOnboarding = () => {
        if (confirm('Resetar onboarding?')) {
            storageService.saveAppSettings({
                completedOnboarding: false,
                completedInitialSetup: false,
                firstTimeUser: true
            });
            alert('Onboarding resetado! Recarregue a página.');
        }
    };

    const activateGodMode = () => {
        if (confirm('Ativar Modo Deus? (Vai injetar 35 dias de histórico perfeito, desbloquear todas as conquistas e dar acesso a TODOS os jogos do Fliperama)')) {
            (storageService as any).enableGodMode();
            alert('Modo Deus ativado! 🌟 Recarregue a página para ver os efeitos.');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background border-2 border-primary/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                🔧 Debug Hydropush
                            </h2>
                            <p className="text-xs text-white/80 mt-1">Ferramentas de desenvolvimento</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border bg-muted/30">
                        {[
                            { id: 'storage', label: 'Storage', icon: Database },
                            { id: 'system', label: 'Sistema', icon: RefreshCw }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? 'bg-background text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {/* Storage Tab */}
                        {activeTab === 'storage' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Database size={18} />
                                        Informações de Storage
                                    </h3>
                                    {storageInfo && (
                                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tamanho estimado:</span>
                                                <span className="font-mono">{Math.round(storageInfo.bytes / 1024)} KB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Número de itens:</span>
                                                <span className="font-mono">{storageInfo.items}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">Ações Destrutivas</h3>
                                    <div className="space-y-2">
                                        <Button
                                            onClick={resetOnboarding}
                                            variant="outline"
                                            className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        >
                                            <RefreshCw size={16} className="mr-2" />
                                            Resetar Onboarding
                                        </Button>
                                        <Button
                                            onClick={clearAllData}
                                            variant="destructive"
                                            className="w-full justify-start"
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Limpar Todos os Dados
                                        </Button>
                                        <Button
                                            onClick={activateGodMode}
                                            variant="outline"
                                            className="w-full justify-start text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                        >
                                            <Sparkles size={16} className="mr-2" />
                                            Ativar Modo Deus (Desbloquear Tudo)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Tab */}
                        {activeTab === 'system' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <RefreshCw size={18} />
                                        Informações do Sistema
                                    </h3>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Plataforma:</span>
                                            <span>Web (PWA)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">User Agent:</span>
                                            <span className="text-xs truncate max-w-xs">{navigator.userAgent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Idioma:</span>
                                            <span>{navigator.language}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Online:</span>
                                            <span>{navigator.onLine ? '✅ Sim' : '❌ Não'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
