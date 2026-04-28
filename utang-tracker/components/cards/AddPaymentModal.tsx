"use client";

import { useState } from "react";
import { fonts, spacing, borderRadius } from "@/lib/design";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtId: string;
  personName: string;
  remaining: number;
  onSuccess: (debtId: string, newStatus: string) => void;
}

const labelStyle = {
  display: "block",
  marginBottom: spacing.sm,
  fontSize: "14px",
  fontWeight: 600,
  color: "#3b0764",
} as const;

const inputStyle = {
  width: "100%",
  padding: spacing.md,
  border: "1px solid #a78bfa",
  borderRadius: borderRadius.md,
  fontSize: "14px",
  boxSizing: "border-box",
  color: "#1a1a2e",
  backgroundColor: "#faf7ff",
  outline: "none",
} as const;

export default function AddPaymentModal({
  isOpen,
  onClose,
  debtId,
  personName,
  remaining,
  onSuccess,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, note: note || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Failed to record payment.");
        return;
      }

      toast.success(`Payment of ₱${parsed.toLocaleString()} recorded!`);
      onSuccess(debtId, data.debt.status);
      setAmount("");
      setNote("");
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parsed = parseFloat(amount) || 0;
  const isFullPayment = parsed >= remaining;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit}>
        {/* Person + remaining info */}
        <div
          style={{
            background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
            border: "1px solid #a78bfa",
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#3b0764",
              fontWeight: 700,
            }}
          >
            {personName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#5b21b6" }}>
            Remaining:{" "}
            <strong>
              ₱{remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
          </p>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Amount Paid *</label>
          <input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max={remaining}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ ...inputStyle, fontFamily: fonts.dmMono }}
            required
          />
          {parsed > 0 && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "11px",
                fontWeight: 600,
                color: isFullPayment ? "#059669" : "#b45309",
              }}
            >
              {isFullPayment
                ? "✓ This will fully settle the debt"
                : `⚡ Partial — ₱${(remaining - parsed).toLocaleString("en-US", { minimumFractionDigits: 2 })} will remain`}
            </p>
          )}
        </div>

        {/* Note */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>
            Note{" "}
            <span style={{ fontWeight: 400, color: "#7c3aed" }}>
              (optional)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Paid via GCash"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Quick fill buttons */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{ ...labelStyle, marginBottom: spacing.sm }}>
            Quick fill
          </label>
          <div style={{ display: "flex", gap: spacing.sm }}>
            {[25, 50, 75, 100].map((pct) => {
              const val = ((remaining * pct) / 100).toFixed(2);
              const isActive = amount === val;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: `2px solid ${isActive ? "#7c3aed" : "#a78bfa"}`,
                    borderRadius: borderRadius.sm,
                    background: isActive ? "#7c3aed" : "#faf7ff",
                    color: isActive ? "white" : "#5b21b6",
                    cursor: "pointer",
                    fontFamily: fonts.dmSans,
                    transition: "all 150ms ease",
                  }}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: spacing.md }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: spacing.md,
              border: "1px solid #a78bfa",
              borderRadius: borderRadius.md,
              backgroundColor: "transparent",
              color: "#7c3aed",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || parsed <= 0}
            style={{
              flex: 1,
              padding: spacing.md,
              border: "none",
              borderRadius: borderRadius.md,
              backgroundColor: parsed <= 0 ? "#c4b5fd" : "#7c3aed",
              color: "white",
              fontWeight: 600,
              cursor: loading || parsed <= 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Saving..."
              : isFullPayment
                ? "Mark as Paid"
                : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
