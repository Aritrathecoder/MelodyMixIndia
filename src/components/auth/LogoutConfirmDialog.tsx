'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmDialogProps {
    isOpen: boolean;
    isGuest: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function LogoutConfirmDialog({ isOpen, isGuest, onConfirm, onCancel }: LogoutConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent showCloseButton={false} className="border-none bg-[#121212]/95 backdrop-blur-2xl p-0 shadow-2xl w-[90vw] max-w-[400px] overflow-hidden">
                {/* Indian Flag Theme Top Border */}
                <div className="h-1 w-full indian-flag-gradient" />
                
                <div className="p-6 text-center">
                    {/* Icon Container */}
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-8 h-8 text-red-400" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2">
                        {isGuest ? 'Exit Guest Mode?' : 'Log Out?'}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                        {isGuest 
                            ? 'You will lose all temporary session data. Sign in to save your music permanently.'
                            : 'Are you sure you want to log out? You can sign back in anytime.'}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1 h-12 bg-transparent border-white/10 text-white hover:bg-white/5 font-medium rounded-full transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-full hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {isGuest ? 'Exit' : 'Log Out'}
                        </Button>
                    </div>
                    
                    {/* Guest Mode Warning */}
                    {isGuest && (
                        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <p className="text-xs text-orange-400 flex items-center justify-center gap-1.5">
                                <span>🎵</span>
                                <span>Guest sessions are temporary and not saved</span>
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
