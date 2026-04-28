"use client";

import { colors, fonts, spacing, borderRadius } from "@/lib/design";

export default function Settings() {
  return (
    <div
      style={{
        padding: spacing.lg,
        fontFamily: fonts.dmSans,
        maxWidth: "100%",
      }}
    >
      <div style={{ marginBottom: spacing.xl }}>
        <h2
          style={{
            color: colors.light,
            marginTop: 0,
            marginBottom: spacing.md,
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          Settings
        </h2>
        <p style={{ color: colors.mutedLight, margin: 0, fontSize: "14px" }}>
          Manage your account preferences
        </p>
      </div>

      <div
        style={{
          background: colors.bgCard,
          border: `1px dashed ${colors.border}`,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          textAlign: "center" as const,
        }}
      >
        <p style={{ margin: 0, color: colors.mutedLight, fontSize: "14px" }}>
          Settings coming soon
        </p>
        <p
          style={{
            margin: "12px 0 0",
            color: colors.mutedLight,
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          I&apos;m still building it, wag atat 🔨
        </p>
        <p
          style={{
            margin: "8px 0 0",
            color: colors.mutedLight,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          by: Justin
        </p>
      </div>
    </div>
  );
}
