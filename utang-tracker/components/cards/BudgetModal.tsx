'use client';

import { useState } from 'react';
import { fonts, borderRadius } from '@/lib/design';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { key: 'food',          label: 'Food',          emoji: '🍜' },
  { key: 'transport',     label: 'Transport',     emoji: '🚌' },
  { key: 'bills',         label: 'Bills',         emoji: '⚡' },
  { key: 'health',        label: 'Health',        emoji: '💊' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎮' },
  { key: 'shopping',      label: 'Shopping',      emoji: '🛍️' },
  { key: 'education',     label: 'Education',     emoji: '📚' },
  { key: 'others',        label: 'Others',        emoji: '📌' },
] as const;

type BudgetItem = {
  id: number;
  category: string;
  limit_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  over_budget: boolean;
};

type Props = {
  isOpen: boolean;
  month: number;
  year: number;
  budgets: BudgetItem[];
  onClose: () => void;
  onSaved: () => void;
};

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatPHP(n: number) {
  return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BudgetModal({ isOpen, month, year, budgets, onClose, onSaved }: Props) {
  const [saving, setSaving]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError]     = useState('');
  // Local limit inputs keyed by category
  const [limits, setLimits]   = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const b of budgets) init[b.category] = String(b.limit_amount);
    return init;
  });

  const getBudget = (cat: string) => budgets.find(b => b.category === cat);

  const handleSave = async (cat: string) => {
    const val = parseFloat(limits[cat] ?? '');
    if (!val || val <= 0) { setError('Enter a valid amount.'); return; }
    setSaving(cat); setError('');
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, limit_amount: val, month, year }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message ?? 'Failed to save.');
        return;
      }
      onSaved();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (cat: string) => {
    const budget = getBudget(cat);
    if (!budget) return;
    setDeleting(budget.id); setError('');
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, { method: 'DELETE' });
      if (!res.ok) { setError('Failed to remove.'); return; }
      setLimits(prev => { const n = { ...prev }; delete n[cat]; return n; });
      onSaved();
    } catch {
      setError('Network error.');
    } finally {
      setDeleting(null);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    fontFamily: fonts.dmSans,
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    background: 'white',
    color: '#1a1a2e',
    boxSizing: 'border-box' as const,
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 50,
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            background: '#fafafa',
            borderRadius: '20px 20px 0 0',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 20px 40px',
            fontFamily: fonts.dmSans,
          }}
        >
          {/* Handle */}
          <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 20px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Monthly Budgets</h3>
              <p style={{ margin: 0, marginTop: '2px', fontSize: '13px', color: '#6b7280' }}>{monthLabel(month, year)}</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1 }}
            >✕</button>
          </div>

          {error && (
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{error}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CATEGORIES.map(({ key: cat, label, emoji }) => {
              const budget   = getBudget(cat);
              const isSaving = saving === cat;
              const isDel    = deleting === budget?.id;
              const pct      = budget ? Math.min(budget.percentage, 100) : 0;
              const over     = budget?.over_budget ?? false;

              return (
                <div
                  key={cat}
                  style={{
                    background: 'white',
                    border: `1.5px solid ${over ? '#fca5a5' : '#e9d5ff'}`,
                    borderRadius: borderRadius.md,
                    padding: '14px',
                  }}
                >
                  {/* Category row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', flex: 1 }}>{label}</span>
                    {budget && (
                      <span style={{ fontSize: '11px', color: over ? '#dc2626' : '#6b7280', fontWeight: 600 }}>
                        {formatPHP(budget.spent)} / {formatPHP(budget.limit_amount)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar (only if budget set) */}
                  {budget && (
                    <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                          height: '100%', borderRadius: '999px',
                          background: over ? '#dc2626' : '#7c3aed',
                        }}
                      />
                    </div>
                  )}

                  {/* Input + actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '13px', fontWeight: 700, color: '#7c3aed',
                      }}>₱</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Set limit"
                        value={limits[cat] ?? ''}
                        onChange={e => setLimits(prev => ({ ...prev, [cat]: e.target.value }))}
                        style={{ ...inputStyle, paddingLeft: '24px', fontSize: '13px' }}
                      />
                    </div>
                    <button
                      onClick={() => handleSave(cat)}
                      disabled={isSaving}
                      style={{
                        padding: '9px 14px', fontSize: '12px', fontWeight: 700,
                        border: 'none', borderRadius: '8px',
                        background: isSaving ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                        color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontFamily: fonts.dmSans, whiteSpace: 'nowrap',
                      }}
                    >
                      {isSaving ? '...' : budget ? 'Update' : 'Set'}
                    </button>
                    {budget && (
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDel}
                        style={{
                          padding: '9px 10px', fontSize: '12px', fontWeight: 600,
                          border: '1.5px solid #fca5a5', borderRadius: '8px',
                          background: 'white', color: '#dc2626',
                          cursor: isDel ? 'not-allowed' : 'pointer',
                          fontFamily: fonts.dmSans, opacity: isDel ? 0.5 : 1,
                        }}
                      >
                        {isDel ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '16px', padding: '12px',
              fontSize: '14px', fontWeight: 600,
              border: '1.5px solid #e5e7eb', borderRadius: '10px',
              background: 'white', color: '#374151', cursor: 'pointer',
              fontFamily: fonts.dmSans,
            }}
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}