import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // iOS Safari doesn't fire beforeinstallprompt — handle separately
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOSDevice) {
      const dismissed = localStorage.getItem("pwa_ios_prompt_dismissed");
      if (!dismissed) {
        setIsIOS(true);
        setShowBanner(true);
      }
      return;
    }

    // Android Chrome / Desktop Chrome / Edge
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(
      isIOS ? "pwa_ios_prompt_dismissed" : "pwa_install_dismissed",
      "1"
    );
  };

  if (!showBanner) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary-600 shrink-0" />
              <span className="font-semibold text-gray-800 text-sm">
                Install Sarinya
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tap the{" "}
            <svg
              className="inline w-3.5 h-3.5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341L6.29 11.738a2.5 2.5 0 110-3.476l6.773-3.387A2.5 2.5 0 0113 4.5z" />
            </svg>{" "}
            Share button, then <strong>"Add to Home Screen"</strong> to install
            Sarinya on your device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                Install Sarinya
              </p>
              <p className="text-xs text-gray-500">Add to home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-0.5 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
