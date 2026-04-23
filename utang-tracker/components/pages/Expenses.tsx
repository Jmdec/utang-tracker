'use client';

import { useState, useEffect, useCallback } from 'react';
import { fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { motion, AnimatePresence } from 'framer-motion';
import AddExpenseModal from '@/components/cards/AddExpenseModal';
import BudgetModal from '@/components/cards/BudgetModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type Expense = {
  id: number;
  amount: number;
  category: string;
  title?: string;
  note?: string;
  expense_date: string;
  created_at: string;
};

type BudgetItem = {
  id: number;
  category: string;
  limit_amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  over_budget: boolean;
};

type Summary = {
  grand_total: number;
  by_category: Record<string, { total: number; count: number }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['all', 'food', 'transport', 'bills', 'health', 'entertainment', 'shopping', 'education', 'others'] as const;

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  food:          { emoji: '🍜', color: '#d97706', bg: '#fef9c3', border: '#fde68a' },
  transport:     { emoji: '🚌', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  bills:         { emoji: '⚡', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  health:        { emoji: '💊', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  entertainment: { emoji: '🎮', color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' },
  shopping:      { emoji: '🛍️', color: '#ec4899', bg: '#fce7f3', border: '#f9a8d4' },
  education:     { emoji: '📚', color: '#0891b2', bg: '#cffafe', border: '#67e8f9' },
  others:        { emoji: '📌', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getNow() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function formatPHP(n: number) {
  return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Expenses() {
  const { month: nowMonth, year: nowYear } = getNow();
  const [month, setMonth]       = useState(nowMonth);
  const [year, setYear]         = useState(nowYear);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [budgets, setBudgets]     = useState<BudgetItem[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, budRes, sumRes] = await Promise.all([
        fetch(`/api/expenses?month=${month}&year=${year}`),
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(`/api/expenses/summary?month=${month}&year=${year}`),
      ]);

      if (expRes.ok) {
        const d = await expRes.json();
        setExpenses(d.expenses ?? []);
      }
      if (budRes.ok) {
        const d = await budRes.json();
        setBudgets(d.budgets ?? []);
      }
      if (sumRes.ok) {
        const d = await sumRes.json();
        setSummary(d.summary ?? null);
      }
    } catch {
      // silent fail — keep stale data
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        fetchAll(); // refresh summary too
      }
    } finally {
      setDeleteId(null);
    }
  };

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  // Filter by category tab
  const filtered = activeTab === 'all'
    ? expenses
    : expenses.filter(e => e.category === activeTab);

  // Group filtered by date
  const grouped: Record<string, Expense[]> = {};
  for (const e of filtered) {
    const key = new Date(e.expense_date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  const getBudget = (cat: string) => budgets.find(b => b.category === cat);

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>

      {/* ── Header ── */}
      {/* ── Header ── */}
<div style={{ marginBottom: spacing.xl }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
    <div>
      <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '24px', fontWeight: 700 }}>Expenses</h2>
      <p style={{ color: '#6b7280', margin: 0, marginTop: '4px', fontSize: '14px' }}>Track where your money goes</p>
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => setShowAdd(true)}
        style={{
          padding: '8px 14px', fontSize: '12px', fontWeight: 700,
          border: 'none', borderRadius: '8px',
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          color: 'white', cursor: 'pointer', fontFamily: fonts.dmSans,
        }}
      >
        + Add Expense
      </button>
      <button
        onClick={() => setShowBudget(true)}
        style={{
          padding: '8px 14px', fontSize: '12px', fontWeight: 600,
          border: '1.5px solid #7c3aed', borderRadius: '8px',
          background: 'transparent', color: '#7c3aed', cursor: 'pointer',
          fontFamily: fonts.dmSans,
        }}
      >
        ⚙ Budgets
      </button>
    </div>
  </div>

  {/* Month navigator */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: spacing.md,
    background: 'white', borderRadius: borderRadius.md,
    border: '1px solid #e9d5ff', padding: `${spacing.sm} ${spacing.md}`,
    width: 'fit-content',
  }}>
    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>‹</button>
    <span style={{ fontWeight: 600, fontSize: '14px', color: '#3b0764', minWidth: '140px', textAlign: 'center' }}>
      {monthLabel(month, year)}
    </span>
    <button
      onClick={() => changeMonth(1)}
      disabled={month === nowMonth && year === nowYear}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '18px', lineHeight: 1, padding: '0 4px', opacity: (month === nowMonth && year === nowYear) ? 0.3 : 1 }}
    >›</button>
  </div>
</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
      ) : (
        <>
          {/* ── Grand total card ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)',
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              marginBottom: spacing.xl,
              color: 'white',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
              Total spent — {monthLabel(month, year)}
            </p>
            <p style={{ margin: 0, marginTop: '8px', fontSize: '36px', fontWeight: 700, fontFamily: fonts.dmMono }}>
              {formatPHP(summary?.grand_total ?? 0)}
            </p>
            <p style={{ margin: 0, marginTop: '8px', fontSize: '13px', opacity: 0.7 }}>
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* ── Category overview pills ── */}
          {summary && Object.keys(summary.by_category).length > 0 && (
            <div style={{ marginBottom: spacing.xl }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>By category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(summary.by_category)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([cat, data]) => {
                    const meta    = CATEGORY_META[cat] ?? CATEGORY_META.others;
                    const budget  = getBudget(cat);
                    const pct     = budget ? Math.min((data.total / budget.limit_amount) * 100, 100) : null;
                    const over    = budget && data.total > budget.limit_amount;
                    return (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          background: 'white',
                          border: `1px solid ${over ? '#fca5a5' : meta.border}`,
                          borderRadius: borderRadius.md,
                          padding: '10px 14px',
                          boxShadow: shadow.sm,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pct !== null ? '8px' : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{meta.emoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', textTransform: 'capitalize' }}>{cat}</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>× {data.count}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: meta.color, fontFamily: fonts.dmMono }}>
                              {formatPHP(data.total)}
                            </span>
                            {budget && (
                              <span style={{ fontSize: '11px', color: over ? '#dc2626' : '#9ca3af', marginLeft: '6px' }}>
                                / {formatPHP(budget.limit_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        {pct !== null && (
                          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                borderRadius: '999px',
                                background: over ? '#dc2626' : meta.color,
                              }}
                            />
                          </div>
                        )}
                        {over && (
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                            Over budget by {formatPHP(data.total - (budget?.limit_amount ?? 0))}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Category filter tabs ── */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: spacing.xl,
            overflowX: 'auto', paddingBottom: '4px',
          }}>
            {CATEGORIES.filter(c => c === 'all' || (summary?.by_category[c])).map((cat) => {
              const meta  = cat === 'all' ? null : CATEGORY_META[cat];
              const isAct = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: `1.5px solid ${isAct ? (meta?.color ?? '#7c3aed') : '#e5e7eb'}`,
                    borderRadius: '999px',
                    background: isAct ? (meta?.bg ?? '#f3e8ff') : 'white',
                    color: isAct ? (meta?.color ?? '#7c3aed') : '#6b7280',
                    cursor: 'pointer',
                    fontFamily: fonts.dmSans,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {meta && <span style={{ marginRight: '4px', fontSize: '12px' }}>{meta.emoji}</span>}
                  {cat === 'all' ? 'All' : cat}
                </button>
              );
            })}
          </div>

          {/* ── Expense list ── */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'white', border: '1px dashed #e9d5ff',
                borderRadius: borderRadius.lg, padding: spacing.xl, textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#7c3aed', fontSize: '14px' }}>No expenses yet</p>
              <p style={{ margin: 0, marginTop: '4px', color: '#a78bfa', fontSize: '12px' }}>
                Tap the button below to log one
              </p>
            </motion.div>
          ) : (
            Object.entries(grouped).map(([dateKey, items], gi) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {dateKey}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', fontFamily: fonts.dmMono }}>
                    {formatPHP(items.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((exp, idx) => {
                    const meta = CATEGORY_META[exp.category] ?? CATEGORY_META.others;
                    const isDeleting = deleteId === exp.id;
                    return (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (gi * items.length + idx) * 0.03 }}
                        style={{
                          background: 'white',
                          border: `1px solid ${meta.border}`,
                          borderRadius: borderRadius.md,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: shadow.sm,
                        }}
                      >
                        {/* Emoji bubble */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: meta.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                          border: `1.5px solid ${meta.border}`,
                        }}>
                          {meta.emoji}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1a1a2e',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exp.title || (exp.category.charAt(0).toUpperCase() + exp.category.slice(1))}
                          </p>
                          {exp.note && (
                            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exp.note}
                            </p>
                          )}
                        </div>

                        {/* Amount + delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: meta.color, fontFamily: fonts.dmMono }}>
                            {formatPHP(exp.amount)}
                          </span>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            disabled={isDeleting}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#d1d5db', fontSize: '14px', padding: '2px',
                              lineHeight: 1, opacity: isDeleting ? 0.4 : 1,
                            }}
                          >✕</button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}



      {/* ── Modals ── */}
      {showAdd && (
        <AddExpenseModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchAll(); }}
        />
      )}
      {showBudget && (
        <BudgetModal
          isOpen={showBudget}
          month={month}
          year={year}
          budgets={budgets}
          onClose={() => setShowBudget(false)}
          onSaved={() => { setShowBudget(false); fetchAll(); }}
        />
      )}
    </div>
  );
}