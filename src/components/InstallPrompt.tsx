import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Check if user has already dismissed it or app is installed
            const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
            if (!isDismissed) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="install-prompt-banner">
            <div className="flex items-center gap-md flex-1">
                <div className="p-sm bg-primary rounded-md text-white">
                    <Download size={20} />
                </div>
                <div>
                    <h4 className="m-0 text-sm font-bold">Instalar App</h4>
                    <p className="m-0 text-xs text-secondary">Acesse mais rápido da sua tela inicial</p>
                </div>
            </div>
            <div className="flex items-center gap-sm">
                <button onClick={handleInstall} className="btn btn-primary text-xs py-xs px-sm">
                    Instalar
                </button>
                <button onClick={handleDismiss} className="p-xs text-secondary hover:text-primary">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
