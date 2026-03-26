'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/hooks/useToast';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ICONS = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />,
};

const BG = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
};

export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);
    const removeToast = useToastStore((s) => s.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm text-white animate-in slide-in-from-right-5 fade-in duration-300 min-w-[280px] max-w-[380px] ${BG[t.type]}`}
                >
                    {ICONS[t.type]}
                    <span className="flex-1">{t.message}</span>
                    <button
                        onClick={() => removeToast(t.id)}
                        className="text-white/40 hover:text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
