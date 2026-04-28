"use client";

import { useState } from "react";
import { fonts, spacing, borderRadius } from "@/lib/design";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { key: "food", label: "Food", emoji: "🍜" },
  { key: "transport", label: "Transport", emoji: "🚌" },
  { key: "bills", label: "Bills", emoji: "⚡" },
  { key: "health", label: "Health", emoji: "💊" },
  { key: "entertainment", label: "Entertainment", emoji: "🎮" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
  { key: "education", label: "Education", emoji: "📚" },
  { key: "others", label: "Others", emoji: "📌" },
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setAmount("");
    setCategory("food");
    setTitle("");
    setNote("");
    setDate(today);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          title: title || undefined,
          note: note || undefined,
          expense_date: date,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.message ?? "Failed to save expense.");
        return;
      }
      reset();
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: fonts.dmSans,
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    background: "white",
    color: "#1a1a2e",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 50,
          padding: "0",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{
            background: "#fafafa",
            borderRadius: "20px 20px 0 0",
            width: "100%",
            maxWidth: "560px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px 20px 40px",
            fontFamily: fonts.dmSans,
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: "40px",
              height: "4px",
              background: "#e5e7eb",
              borderRadius: "2px",
              margin: "0 auto 20px",
            }}
          />

          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            Log Expense
          </h3>

          {/* Amount */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Amount</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#7c3aed",
                }}
              >
                ₱
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: "28px",
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: fonts.dmMono,
                }}
              />
            </div>
          </div>

          {/* Category grid */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Category</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  style={{
                    padding: "10px 4px",
                    border: `2px solid ${category === cat.key ? "#7c3aed" : "#e5e7eb"}`,
                    borderRadius: "10px",
                    background: category === cat.key ? "#f3e8ff" : "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    fontFamily: fonts.dmSans,
                    transition: "all 150ms",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{cat.emoji}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: category === cat.key ? "#7c3aed" : "#6b7280",
                    }}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>
              Title{" "}
              <span
                style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}
              >
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jollibee lunch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>
              Note{" "}
              <span
                style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}
              >
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "13px",
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                background: "white",
                color: "#374151",
                cursor: "pointer",
                fontFamily: fonts.dmSans,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 2,
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                borderRadius: "10px",
                background: saving
                  ? "#a78bfa"
                  : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: fonts.dmSans,
              }}
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
