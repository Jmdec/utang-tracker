"use client";

import { useState, useEffect } from "react";
import { colors } from "@/lib/design";
import { useAuthStore } from "@/lib/store";
import Dashboard from "@/components/pages/Dashboard";
import People from "@/components/pages/People";
import History from "@/components/pages/History";
import Expenses from "@/components/pages/Expenses";
import Wallet from "@/components/pages/Wallet";
import Reports from "@/components/pages/Reports";
import Goals from "@/components/pages/Goals";
import Settings from "@/components/pages/Settings";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import AddContactModal from "@/components/cards/AddContactModal";
import AddDebtModal from "@/components/cards/AddDebtModal";

export type Tab =
  | "home"
  | "people"
  | "history"
  | "expenses"
  | "wallet"
  | "reports"
  | "settings"
  | "goals";

export default function Home() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [mounted, setMounted] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!mounted) return null;

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />;
      case "people":
        return <People />;
      case "history":
        return <History />;
      case "expenses":
        return <Expenses />;
      case "wallet":
        return <Wallet />;
      case "reports":
        return <Reports />;
      case "goals":
        return <Goals />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const showContactBtn = activeTab === "home" || activeTab === "people";
  const showDebtBtn = activeTab === "home";

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #e9d5ff 100%)",
        color: "#333333",
        height: "100vh", // ← was minHeight, now fixed height
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // ← lock the outer container
      }}
    >
      <Header />

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden", // ← lock this too
          alignItems: "stretch",
        }}
      >
        {!isMobile && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {(showContactBtn || showDebtBtn) && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "16px 20px 0",
                flexShrink: 0,
              }}
            >
              {showContactBtn && (
                <button
                  onClick={() => setShowAddContact(true)}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: colors.brand,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  + Contact
                </button>
              )}
              {showDebtBtn && (
                <button
                  onClick={() => setShowAddDebt(true)}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "transparent",
                    color: colors.brand,
                    border: `2px solid ${colors.brand}`,
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  + Debt
                </button>
              )}
            </div>
          )}

          {/* ← only this div scrolls */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: isMobile ? "80px" : "20px",
            }}
          >
            {renderPage()}
          </div>
        </main>
      </div>

      {isMobile && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
      />
      <AddDebtModal
        isOpen={showAddDebt}
        onClose={() => setShowAddDebt(false)}
      />
    </div>
  );
}
