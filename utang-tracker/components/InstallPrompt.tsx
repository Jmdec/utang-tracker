"use client";

import { useState, useEffect } from "react";
import { fonts } from "@/lib/design";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Set origin safely on client
    setOrigin(window.location.origin);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    if (sessionStorage.getItem("pwa-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "1");
    setDismissed(true);
  };

  if (!installPrompt || isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          bottom: "90px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 16px",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          style={{
            width: "100%",
            maxWidth: "420px",
            pointerEvents: "all",
            background: "white",
            border: "1.5px solid #e9d5ff",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(124,58,237,0.18)",
            fontFamily: fonts.dmSans,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Icon */}
          <img
            src={origin ? `${origin}/tracker-logo.png` : "/tracker-logo.png"}
            alt="Finance Tracker"
            onError={(e) => {
              // Fallback if image still fails
              (e.target as HTMLImageElement).style.display = "none";
            }}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              flexShrink: 0,
              objectFit: "cover",
            }}
          />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "13px",
                color: "#1a1a2e",
              }}
            >
              Install Finance Tracker
            </p>
            <p
              style={{
                margin: 0,
                marginTop: "2px",
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              Add to home screen for quick access
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={handleDismiss}
              style={{
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
                color: "#6b7280",
                cursor: "pointer",
                fontFamily: fonts.dmSans,
              }}
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                border: "none",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                color: "white",
                cursor: "pointer",
                fontFamily: fonts.dmSans,
              }}
            >
              Install
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
