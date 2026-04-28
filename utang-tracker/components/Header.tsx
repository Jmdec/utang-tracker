"use client";

import { colors, fonts, spacing, borderRadius, shadow } from "@/lib/design";
import { useAuthStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";

// Extend window to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Header() {
  const { user, setUser, setToken } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isRealIOS =
      /iphone|ipad|ipod/i.test(ua) &&
      /safari/i.test(ua) &&
      !/chrome|crios|fxios|edgios/i.test(ua);
    setIsIOS(isRealIOS);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowIOSGuide(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Call the logout API to clear the auth_token cookie
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // silent — still log out client-side even if request fails
    } finally {
      // Clear Zustand store
      setUser(null);
      setToken(null);
      // Redirect to login
      window.location.href = "/auth/login";
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  const showInstallButton = !isInstalled && (isIOS || !!deferredPrompt);

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header
      style={{
        background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
        borderBottom: `1px solid #d8b4fe`,
        padding: `${spacing.md} ${spacing.lg}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: shadow.md,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <div
          style={{
            fontFamily: fonts.caveat,
            fontSize: "24px",
            fontWeight: 700,
            color: "#5b21b6",
          }}
        >
          Personal Finance Tracker
        </div>
      </div>

      {/* Right side: Install button + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
        {/* Install App Button */}
        {showInstallButton && (
          <button
            onClick={handleInstall}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: borderRadius.full,
              background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Install App
          </button>
        )}

        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(91,33,182,0.3)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                border: `1px solid #d8b4fe`,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                boxShadow: "0 8px 40px rgba(124,58,237,0.25)",
                width: "100%",
                maxWidth: "360px",
              }}
            >
              <button
                onClick={() => setShowIOSGuide(false)}
                style={{
                  position: "absolute",
                  top: spacing.md,
                  right: spacing.md,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  color: "#7c3aed",
                  lineHeight: 1,
                }}
              >
                ×
              </button>

              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#5b21b6",
                }}
              >
                Add to Home Screen
              </p>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "#7c3aed",
                }}
              >
                Install Personal Finance Tracker on your iPhone in 3 easy steps:
              </p>

              {[
                {
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  ),
                  text: (
                    <>
                      Tap the <strong>Share</strong> button{" "}
                      <span style={{ fontSize: "12px", color: "#7c3aed" }}>
                        (the box with the arrow pointing up)
                      </span>{" "}
                      at the bottom of Safari
                    </>
                  ),
                },
                {
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  ),
                  text: (
                    <>
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </>
                  ),
                },
                {
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ),
                  text: (
                    <>
                      Tap <strong>"Add"</strong> in the top right corner
                    </>
                  ),
                },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: borderRadius.full,
                      background: "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {step.icon}
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "13px",
                      color: "#3b0764",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.text}
                  </p>
                </div>
              ))}

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "12px",
                  color: "#a78bfa",
                  textAlign: "center",
                }}
              >
                💡 Make sure you're using Safari — other browsers don't support
                this on iOS.
              </p>
            </div>
          </div>
        )}

        {/* Avatar + Dropdown */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: borderRadius.full,
              background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {initials}
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                border: `1px solid #d8b4fe`,
                borderRadius: borderRadius.md,
                overflow: "hidden",
                minWidth: "200px",
                boxShadow: shadow.lg,
                zIndex: 50,
                marginTop: spacing.sm,
              }}
            >
              {/* User Info */}
              <div
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderBottom: `1px solid #d8b4fe`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#5b21b6",
                  }}
                >
                  {user?.name ?? "User"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#7c3aed" }}>
                  {user?.email ?? ""}
                </p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  width: "100%",
                  padding: `${spacing.md} ${spacing.lg}`,
                  backgroundColor: "transparent",
                  color: loggingOut ? "#9ca3af" : "#dc2626",
                  border: "none",
                  textAlign: "left",
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  if (!loggingOut)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#fee2e2";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
