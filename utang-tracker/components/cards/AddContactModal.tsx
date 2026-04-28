"use client";

import { useState } from "react";
import { useDataStore } from "@/lib/store";
import { colors, spacing, borderRadius } from "@/lib/design";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface AddContactModalProps {
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

export default function AddContactModal({
  isOpen,
  onClose,
}: AddContactModalProps) {
  const { addContact } = useDataStore();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Failed to add contact.");
        return;
      }

      addContact({
        id: data.contact.id.toString(),
        userId: "1",
        name: data.contact.name,
        phone: data.contact.phone ?? undefined,
        email: data.contact.email ?? undefined,
        notes: data.contact.notes ?? undefined,
        createdAt: data.contact.created_at,
      });

      toast.success(`${data.contact.name} added!`);
      setFormData({ name: "", phone: "", email: "", notes: "" });
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Contact">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            placeholder="555-0123"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            style={{
              ...inputStyle,
              minHeight: "100px",
              fontFamily: "inherit",
              resize: "vertical",
            }}
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
            {loading ? "Saving..." : "Add Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
