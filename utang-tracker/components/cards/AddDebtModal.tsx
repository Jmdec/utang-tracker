"use client";

import { useState } from "react";
import { useDataStore } from "@/lib/store";
import { colors, spacing, borderRadius } from "@/lib/design";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function AddDebtModal({ isOpen, onClose }: AddDebtModalProps) {
  const { addDebt, contacts } = useDataStore();
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    type: "borrowed" as "borrowed" | "lent",
    description: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName.trim() || !formData.amount) return;

    setLoading(true);

    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_name: formData.personName,
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description || undefined,
          due_date: formData.dueDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Failed to add debt.");
        return;
      }

      addDebt({
        id: data.debt.id.toString(),
        userId: "1",
        personName: data.debt.person_name,
        amount: data.debt.amount,
        type: data.debt.type,
        description: data.debt.description ?? undefined,
        status: data.debt.status,
        dueDate: data.debt.due_date ?? undefined,
        createdAt: data.debt.created_at,
        updatedAt: data.debt.updated_at,
      });

      const label = formData.type === "borrowed" ? "You owe" : "They owe";
      toast.success(
        `${label} ${formData.personName} ₱${parseFloat(formData.amount).toLocaleString()}`,
      );

      setFormData({
        personName: "",
        amount: "",
        type: "borrowed",
        description: "",
        dueDate: "",
      });
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Debt">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Person *</label>
          <select
            value={formData.personName}
            onChange={(e) =>
              setFormData({ ...formData, personName: e.target.value })
            }
            style={inputStyle}
            required
          >
            <option value="">Select a person or enter name below</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.name}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>

        {!formData.personName && (
          <div style={{ marginBottom: spacing.lg }}>
            <input
              type="text"
              placeholder="Or type a new name"
              value={formData.personName}
              onChange={(e) =>
                setFormData({ ...formData, personName: e.target.value })
              }
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Type *</label>
          <div
            style={{
              display: "flex",
              gap: spacing.sm,
            }}
          >
            {(["borrowed", "lent"] as const).map((type) => {
              const isSelected = formData.type === type;
              return (
                <label
                  key={type}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: spacing.md,
                    border: `2px solid ${isSelected ? "#7c3aed" : "#a78bfa"}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: isSelected ? "#ede9fe" : "#faf7ff",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={isSelected}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "borrowed" | "lent",
                      })
                    }
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isSelected ? "#3b0764" : "#6d28d9",
                    }}
                  >
                    {type === "borrowed" ? "🔴 I Owe" : "🟢 They Owe"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Amount *</label>
          <input
            type="number"
            placeholder="0.00"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            placeholder="What is this debt for?"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            style={inputStyle}
          />
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
            disabled={loading}
            style={{
              flex: 1,
              padding: spacing.md,
              border: "none",
              borderRadius: borderRadius.md,
              backgroundColor: colors.brand,
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Add Debt"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
