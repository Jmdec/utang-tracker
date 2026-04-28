"use client";

import { colors, spacing, borderRadius } from "@/lib/design";
import type { Tab } from "@/app/page";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const navItems: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "expenses", icon: "💸", label: "Expenses" },
  { id: "wallet", icon: "💰", label: "Wallet" },
  { id: "people", icon: "👥", label: "People" },
  { id: "history", icon: "📜", label: "History" },
  { id: "reports", icon: "📊", label: "Reports" },
  { id: "goals", icon: "🎯", label: "Goals" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      style={{
        width: "250px",
        height: "100%", // ← fill parent, not 100vh
        flexShrink: 0,
        background: "#ffffff",
        borderRight: `1px solid ${colors.border}`,
        padding: spacing.lg,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "28px",
          padding: `${spacing.md} ${spacing.lg}`,
        }}
      >
        <img
          src="/persona-expense-tracker.png"
          alt="Personal Finance Tracker"
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "28px",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      </div>

      {/* ── Nav ── */}
      <nav
        style={{ display: "flex", flexDirection: "column", gap: spacing.md }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md,
              width: "100%",
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor:
                activeTab === item.id ? colors.brand : "transparent",
              color: activeTab === item.id ? "white" : "#5b21b6",
              border: "none",
              borderRadius: borderRadius.md,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: `all 200ms ease-in-out`,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id)
                e.currentTarget.style.backgroundColor =
                  "rgba(139, 92, 246, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
