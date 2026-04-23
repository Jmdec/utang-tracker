'use client';

import { useState, useEffect, useCallback } from 'react';
import { fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { motion, AnimatePresence } from 'framer-motion';

type WalletEntry = {
  id: number;
  amount: number;
  type: 'income' | 'adjustment';
  source?: string;
  note?: string;
  entry_date: string;
};

type WalletData = {
  entries: WalletEntry[];
  total_income: number;
  total_expenses: number;
  balance: number;
};

function formatPHP(n: number) {
  return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getNow() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Wallet() {
  const { month: nowMonth, year: nowYear } = getNow();
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear]   = useState(nowYear);

  const [wallet, setWallet]       = useState<WalletData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  // Add form
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount]   = useState('');
  const [type, setType]       = useState<'income' | 'adjustment'>('income');
  const [source, setSource]   = useState('');
  const [note, setNote]       = useState('');
  const [date, setDate]       = useState(today);
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?month=${month}&year=${year}`);
      if (res.ok) {
        const d = await res.json();
        setWallet(d);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleAddEntry = async () => {
    if (!amount || parseFloat(amount) <= 0) { setFormError('Enter a valid amount.'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          source: source || undefined,
          note: note || undefined,
          entry_date: date,
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.message ?? 'Failed.'); return; }
      setAmount(''); setSource(''); setNote(''); setDate(today);
      setShowAdd(false);
      fetchWallet();
    } catch { setFormError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/wallet/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWallet();
    } finally { setDeleteId(null); }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: fonts.dmSans,
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    background: 'white',
    color: '#1a1a2e',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  // Group entries by date
  const grouped: Record<string, WalletEntry[]> = {};
  for (const e of (wallet?.entries ?? [])) {
    const key = new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '24px', fontWeight: 700 }}>Wallet</h2>
            <p style={{ color: '#6b7280', margin: 0, marginTop: '4px', fontSize: '14px' }}>Income & balance tracker</p>
          </div>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: 700,
              border: 'none', borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white', cursor: 'pointer', fontFamily: fonts.dmSans,
            }}
          >
            + Income
          </button>
        </div>

        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: spacing.md,
          background: 'white', borderRadius: borderRadius.md,
          border: '1px solid #e9d5ff', padding: `${spacing.sm} ${spacing.md}`,
          width: 'fit-content',
        }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '18px', padding: '0 4px' }}>‹</button>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#3b0764', minWidth: '140px', textAlign: 'center' }}>
            {monthLabel(month, year)}
          </span>
          <button
            onClick={() => changeMonth(1)}
            disabled={month === nowMonth && year === nowYear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '18px', padding: '0 4px', opacity: (month === nowMonth && year === nowYear) ? 0.3 : 1 }}
          >›</button>
        </div>
      </div>

      {/* Add income form (collapsible) */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: spacing.xl }}
          >
            <div style={{ background: 'white', border: '1.5px solid #e9d5ff', borderRadius: borderRadius.lg, padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>Add Income / Adjustment</h4>

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['income', 'adjustment'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600,
                      border: `2px solid ${type === t ? '#7c3aed' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      background: type === t ? '#f3e8ff' : 'white',
                      color: type === t ? '#7c3aed' : '#6b7280',
                      cursor: 'pointer', fontFamily: fonts.dmSans, textTransform: 'capitalize',
                    }}
                  >
                    {t === 'income' ? '💰 Income' : '⚖️ Adjustment'}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>₱</span>
                  <input
                    type="number" inputMode="decimal" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '28px', fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Source</label>
                  <input type="text" placeholder="e.g. Salary, Freelance" value={source} onChange={e => setSource(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Note (optional)</label>
                <input type="text" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
              </div>

              {formError && <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{formError}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontFamily: fonts.dmSans }}>Cancel</button>
                <button onClick={handleAddEntry} disabled={saving} style={{ flex: 2, padding: '10px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', background: saving ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: fonts.dmSans }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
      ) : (
        <>
          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: spacing.xl }}>
            {[
              { label: 'Total income', value: wallet?.total_income ?? 0, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
              { label: 'Total spent',  value: wallet?.total_expenses ?? 0, color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
              { label: 'Balance',      value: wallet?.balance ?? 0, color: (wallet?.balance ?? 0) >= 0 ? '#7c3aed' : '#dc2626', bg: '#f3e8ff', border: '#e9d5ff' },
            ].map(card => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: borderRadius.md, padding: '12px', textAlign: 'center' }}
              >
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: 700, color: card.color, fontFamily: fonts.dmMono }}>
                  {formatPHP(card.value)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Entries list */}
          {(wallet?.entries ?? []).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: 'white', border: '1px dashed #e9d5ff', borderRadius: borderRadius.lg, padding: spacing.xl, textAlign: 'center' }}
            >
              <p style={{ margin: 0, color: '#7c3aed', fontSize: '14px' }}>No entries this month</p>
              <p style={{ margin: 0, marginTop: '4px', color: '#a78bfa', fontSize: '12px' }}>Add your income to start tracking</p>
            </motion.div>
          ) : (
            Object.entries(grouped).map(([dateKey, items]) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(entry => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        background: 'white',
                        border: `1px solid ${entry.type === 'income' ? '#86efac' : '#d1d5db'}`,
                        borderRadius: borderRadius.md,
                        padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        boxShadow: shadow.sm,
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: entry.type === 'income' ? '#dcfce7' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', flexShrink: 0,
                        border: `1.5px solid ${entry.type === 'income' ? '#86efac' : '#d1d5db'}`,
                      }}>
                        {entry.type === 'income' ? '💰' : '⚖️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>
                          {entry.source || (entry.type === 'income' ? 'Income' : 'Adjustment')}
                        </p>
                        {entry.note && (
                          <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: entry.type === 'income' ? '#16a34a' : '#6b7280', fontFamily: fonts.dmMono }}>
                          +{formatPHP(entry.amount)}
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleteId === entry.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', padding: '2px', lineHeight: 1, opacity: deleteId === entry.id ? 0.4 : 1 }}
                        >✕</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}