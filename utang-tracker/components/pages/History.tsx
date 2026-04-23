'use client';

import { useState, useEffect, useCallback } from 'react';
import { fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { motion, AnimatePresence } from 'framer-motion';
import AddPaymentModal from '@/components/cards/AddPaymentModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentItem = {
  id: string;
  amount: number;
  note?: string;
  date: string;
};

type DebtItem = {
  id: string;
  debtId: string;
  date: string;
  personName: string;
  amount: number;
  remaining: number;
  debtType: 'borrowed' | 'lent';
  description?: string;
  status: string;
  payments: PaymentItem[];
};

type Expense = {
  id: number;
  amount: number;
  category: string;
  title?: string;
  note?: string;
  expense_date: string;
  created_at: string;
};

type WalletEntry = {
  id: number;
  amount: number;
  type: 'income' | 'adjustment';
  source?: string;
  note?: string;
  entry_date: string;
};

type Goal = {
  id: number;
  title: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  remaining: number;
  progress: number;
  target_date: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DEBT_FILTER_OPTIONS = ['All', 'Unpaid', 'Partial', 'Paid'] as const;
type DebtFilter = typeof DEBT_FILTER_OPTIONS[number];

const GOAL_FILTER_OPTIONS = ['All', 'Active', 'Completed'] as const;
type GoalFilter = typeof GOAL_FILTER_OPTIONS[number];

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

const GOAL_STATUS_META = {
  active:    { bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff', label: 'Active'    },
  completed: { bg: '#dcfce7', color: '#16a34a', border: '#86efac', label: 'Completed' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db', label: 'Cancelled' },
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

function groupByDate<T>(items: T[], getDate: (item: T) => string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    const key = new Date(getDate(item) + (getDate(item).includes('T') ? '' : 'T00:00:00'))
      .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  return grouped;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function History() {
  const { month: nowMonth, year: nowYear } = getNow();
  const [activeTab, setActiveTab] = useState<'debts' | 'expenses' | 'wallet' | 'goals'>('debts');
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear]   = useState(nowYear);

  // Debts state
  const [debts, setDebts]               = useState<DebtItem[]>([]);
  const [debtFilter, setDebtFilter]     = useState<DebtFilter>('All');
  const [loadingDebts, setLoadingDebts] = useState(true);
  const [markingPaid, setMarkingPaid]   = useState<string | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [paymentModal, setPaymentModal] = useState<{
    debtId: string; personName: string; remaining: number;
  } | null>(null);

  // Expenses state
  const [expenses, setExpenses]               = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Wallet state
  const [walletEntries, setWalletEntries]   = useState<WalletEntry[]>([]);
  const [loadingWallet, setLoadingWallet]   = useState(true);

  // Goals state
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [goalFilter, setGoalFilter]     = useState<GoalFilter>('All');
  const [loadingGoals, setLoadingGoals] = useState(true);

  // ── Fetch debts ──
  const fetchDebts = async () => {
    setLoadingDebts(true);
    try {
      const res = await fetch('/api/debts');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const items: DebtItem[] = (data.debts ?? []).map((debt: any) => ({
        id: `debt-${debt.id}`,
        debtId: debt.id.toString(),
        date: debt.created_at,
        personName: debt.person_name,
        amount: debt.amount,
        remaining: debt.remaining,
        debtType: debt.type,
        description: debt.description,
        status: debt.status,
        payments: (debt.payments ?? []).map((p: any) => ({
          id: p.id.toString(),
          amount: p.amount,
          note: p.note,
          date: p.created_at,
        })),
      }));
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDebts(items);
    } catch { setDebts([]); }
    finally { setLoadingDebts(false); }
  };

  // ── Fetch expenses ──
  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch(`/api/expenses?month=${month}&year=${year}`);
      if (res.ok) { const d = await res.json(); setExpenses(d.expenses ?? []); }
    } catch { setExpenses([]); }
    finally { setLoadingExpenses(false); }
  }, [month, year]);

  // ── Fetch wallet ──
  const fetchWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      const res = await fetch(`/api/wallet?month=${month}&year=${year}`);
      if (res.ok) { const d = await res.json(); setWalletEntries(d.entries ?? []); }
    } catch { setWalletEntries([]); }
    finally { setLoadingWallet(false); }
  }, [month, year]);

  // ── Fetch goals ──
  const fetchGoals = useCallback(async () => {
    setLoadingGoals(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) { const d = await res.json(); setGoals(d.goals ?? []); }
    } catch { setGoals([]); }
    finally { setLoadingGoals(false); }
  }, []);

  useEffect(() => { fetchDebts(); }, []);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchWallet(); }, [fetchWallet]);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  // ── Debt handlers ──
  const handleMarkPaid = async (debtId: string) => {
    setMarkingPaid(debtId);
    try {
      const res = await fetch(`/api/debts/${debtId}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed');
      setDebts(prev => prev.map(d =>
        d.debtId === debtId ? { ...d, status: 'paid', remaining: 0 } : d
      ));
    } catch { /* silent */ }
    finally { setMarkingPaid(null); }
  };

  const togglePayments = (debtId: string) => {
    setExpandedPayments(prev => {
      const next = new Set(prev);
      next.has(debtId) ? next.delete(debtId) : next.add(debtId);
      return next;
    });
  };

  const filteredDebts = debts.filter(debt => {
    if (debtFilter === 'Unpaid')  return debt.status === 'unpaid';
    if (debtFilter === 'Partial') return debt.status === 'partially_paid';
    if (debtFilter === 'Paid')    return debt.status === 'paid';
    return true;
  });

  const filteredGoals = goals.filter(goal => {
    if (goalFilter === 'Active')    return goal.status === 'active';
    if (goalFilter === 'Completed') return goal.status === 'completed';
    return true;
  });

  const groupedDebts    = groupByDate(filteredDebts, d => d.date);
  const groupedExpenses = groupByDate(expenses, e => e.expense_date);
  const groupedWallet   = groupByDate(walletEntries, w => w.entry_date);
  const groupedGoals    = groupByDate(filteredGoals, g => g.created_at);

  const getAccent = (debt: DebtItem) => {
    if (debt.status === 'paid') return { color: '#059669', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#34d399' };
    if (debt.status === 'partially_paid') return { color: '#d97706', bg: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)', border: '#fbbf24' };
    if (debt.debtType === 'borrowed') return { color: '#db2777', bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', border: '#f472b6' };
    return { color: '#7c3aed', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', border: '#a78bfa' };
  };

  const getIcon = (debt: DebtItem) => {
    if (debt.status === 'paid') return '✅';
    if (debt.status === 'partially_paid') return '⚡';
    if (debt.debtType === 'borrowed') return '📥';
    return '📤';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':           return { bg: '#d1fae5', color: '#065f46', label: 'Paid' };
      case 'partially_paid': return { bg: '#fef3c7', color: '#92400e', label: 'Partial' };
      default:               return { bg: '#fce7f3', color: '#9d174d', label: 'Unpaid' };
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // ── Month navigator (shared for expenses & wallet) ──
  const MonthNav = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: spacing.md,
      background: 'white', borderRadius: borderRadius.md,
      border: '1px solid #e9d5ff', padding: `${spacing.sm} ${spacing.md}`,
      width: 'fit-content', marginBottom: spacing.xl,
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
  );

  const EmptyState = ({ message }: { message: string }) => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'white', border: '1px dashed #c4b5fd', borderRadius: borderRadius.lg, padding: spacing.xl, textAlign: 'center' }}
    >
      <p style={{ margin: 0, color: '#7c3aed', fontSize: '14px' }}>{message}</p>
    </motion.div>
  );

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '24px', fontWeight: 700 }}>History</h2>
        <p style={{ color: '#6b7280', margin: 0, marginTop: '4px', fontSize: '14px' }}>All your transactions in one place</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: spacing.xl,
        background: '#ede9fe', borderRadius: borderRadius.lg, padding: '4px',
      }}>
        {([
          { key: 'debts',    label: '🤝 Debts'    },
          { key: 'expenses', label: '🧾 Expenses'  },
          { key: 'wallet',   label: '💰 Wallet'    },
          { key: 'goals',    label: '🎯 Goals'     },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: `${spacing.sm} 4px`, border: 'none',
              borderRadius: borderRadius.md, fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: fonts.dmSans,
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#7c3aed' : '#9b77e0',
              boxShadow: activeTab === tab.key ? shadow.sm : 'none',
              transition: 'all 200ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: DEBTS
      ══════════════════════════════════════════ */}
      {activeTab === 'debts' && (
        <>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, flexWrap: 'wrap' }}>
            {[
              { label: 'Debts',    value: debts.length,                              color: '#7c3aed' },
              { label: 'Payments', value: debts.reduce((s, d) => s + d.payments.length, 0), color: '#059669' },
              { label: 'Unpaid',   value: debts.filter(d => d.status !== 'paid').length, color: '#db2777' },
            ].map(chip => (
              <div key={chip.label} style={{
                background: 'white', border: '1px solid #e9d5ff',
                borderRadius: borderRadius.lg, padding: `${spacing.xs} ${spacing.md}`,
                fontSize: '12px', color: chip.color, fontWeight: 600,
              }}>
                {chip.value} {chip.label}
              </div>
            ))}
          </div>

          {/* Debt filter */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: spacing.xl,
            background: '#f3f4f6', borderRadius: borderRadius.md, padding: '4px',
          }}>
            {DEBT_FILTER_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setDebtFilter(opt)}
                style={{
                  flex: 1, padding: '6px 8px', border: 'none',
                  borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: fonts.dmSans,
                  background: debtFilter === opt ? 'white' : 'transparent',
                  color: debtFilter === opt ? '#7c3aed' : '#6b7280',
                  boxShadow: debtFilter === opt ? shadow.sm : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {loadingDebts ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
          ) : filteredDebts.length === 0 ? (
            <EmptyState message="No debt history yet" />
          ) : (
            Object.entries(groupedDebts).map(([dateKey, items], groupIdx) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ flex: 1, height: '1px', background: '#e9d5ff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {items.map((debt, idx) => {
                    const accent = getAccent(debt);
                    const isPaid = debt.status === 'paid';
                    const isMarkingThis = markingPaid === debt.debtId;
                    const isExpanded = expandedPayments.has(debt.debtId);
                    const hasPayments = debt.payments.length > 0;

                    return (
                      <motion.div
                        key={debt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (groupIdx * items.length + idx) * 0.04 }}
                        style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: accent.bg, border: `2px solid ${accent.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', flexShrink: 0, marginTop: '2px',
                        }}>
                          {getIcon(debt)}
                        </div>

                        <div style={{
                          flex: 1, background: accent.bg, border: `1px solid ${accent.border}`,
                          borderRadius: borderRadius.md, boxShadow: shadow.sm,
                          opacity: isPaid ? 0.9 : 1, overflow: 'hidden',
                        }}>
                          <div style={{ padding: spacing.md }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#3b0764' }}>{debt.personName}</p>
                                <p style={{ margin: 0, marginTop: '2px', fontSize: '12px', color: accent.color, fontWeight: 600 }}>
                                  {debt.debtType === 'borrowed' ? 'You owe' : 'They owe'}
                                </p>
                                {debt.description && (
                                  <p style={{ margin: 0, marginTop: '4px', fontSize: '12px', color: '#5b21b6' }}>{debt.description}</p>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: spacing.sm }}>
                                <p style={{
                                  margin: 0, fontWeight: 700, fontSize: '16px',
                                  color: accent.color, fontFamily: fonts.dmMono,
                                  textDecoration: isPaid ? 'line-through' : 'none',
                                  opacity: isPaid ? 0.6 : 1,
                                }}>
                                  {formatPHP(debt.amount)}
                                </p>
                                {debt.status === 'partially_paid' && (
                                  <p style={{ margin: 0, marginTop: '2px', fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                                    {formatPHP(debt.remaining)} left
                                  </p>
                                )}
                                <p style={{ margin: 0, marginTop: '2px', fontSize: '11px', color: '#7c3aed' }}>
                                  {formatTime(debt.date)}
                                </p>
                              </div>
                            </div>

                            <div style={{ marginTop: spacing.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                  borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                  background: getStatusBadge(debt.status).bg,
                                  color: getStatusBadge(debt.status).color,
                                }}>
                                  {getStatusBadge(debt.status).label}
                                </span>
                                {hasPayments && (
                                  <button
                                    onClick={() => togglePayments(debt.debtId)}
                                    style={{
                                      fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                                      borderRadius: '999px', border: `1px solid ${accent.border}`,
                                      background: 'transparent', color: accent.color,
                                      cursor: 'pointer', fontFamily: fonts.dmSans,
                                    }}
                                  >
                                    {isExpanded ? '▲' : '▼'} {debt.payments.length} payment{debt.payments.length > 1 ? 's' : ''}
                                  </button>
                                )}
                              </div>
                              {!isPaid && (
                                <div style={{ display: 'flex', gap: spacing.sm }}>
                                  <button
                                    onClick={() => setPaymentModal({ debtId: debt.debtId, personName: debt.personName, remaining: debt.remaining ?? debt.amount })}
                                    style={{
                                      padding: '4px 10px', fontSize: '11px', fontWeight: 700,
                                      border: '1.5px solid #7c3aed', borderRadius: '999px',
                                      background: 'transparent', color: '#7c3aed',
                                      cursor: 'pointer', fontFamily: fonts.dmSans, whiteSpace: 'nowrap',
                                    }}
                                  >
                                    + Add Payment
                                  </button>
                                  <button
                                    onClick={() => handleMarkPaid(debt.debtId)}
                                    disabled={isMarkingThis}
                                    style={{
                                      padding: '4px 10px', fontSize: '11px', fontWeight: 700,
                                      border: '1.5px solid #059669', borderRadius: '999px',
                                      background: isMarkingThis ? '#d1fae5' : 'transparent',
                                      color: '#059669', cursor: isMarkingThis ? 'not-allowed' : 'pointer',
                                      fontFamily: fonts.dmSans, whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {isMarkingThis ? 'Saving...' : '✓ Mark as Paid'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && hasPayments && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden', borderTop: `1px dashed ${accent.border}` }}
                              >
                                {debt.payments.map((payment, pIdx) => (
                                  <div
                                    key={payment.id}
                                    style={{
                                      padding: `${spacing.sm} ${spacing.md}`,
                                      borderBottom: pIdx < debt.payments.length - 1 ? `1px dashed ${accent.border}` : 'none',
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      background: 'rgba(255,255,255,0.4)',
                                    }}
                                  >
                                    <div>
                                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#059669' }}>💸 Payment</p>
                                      {payment.note && <p style={{ margin: 0, fontSize: '11px', color: '#5b21b6' }}>{payment.note}</p>}
                                      <p style={{ margin: 0, fontSize: '10px', color: '#7c3aed' }}>{formatTime(payment.date)}</p>
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#059669', fontFamily: fonts.dmMono }}>
                                      {formatPHP(payment.amount)}
                                    </p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
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

      {/* ══════════════════════════════════════════
          TAB: EXPENSES
      ══════════════════════════════════════════ */}
      {activeTab === 'expenses' && (
        <>
          <MonthNav />

          {/* Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)',
            borderRadius: borderRadius.lg, padding: spacing.xl,
            marginBottom: spacing.xl, color: 'white',
          }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
              Total spent — {monthLabel(month, year)}
            </p>
            <p style={{ margin: 0, marginTop: '8px', fontSize: '32px', fontWeight: 700, fontFamily: fonts.dmMono }}>
              {formatPHP(expenses.reduce((s, e) => s + e.amount, 0))}
            </p>
            <p style={{ margin: 0, marginTop: '6px', fontSize: '13px', opacity: 0.7 }}>
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loadingExpenses ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
          ) : expenses.length === 0 ? (
            <EmptyState message="No expenses this month" />
          ) : (
            Object.entries(groupedExpenses).map(([dateKey, items], gi) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', fontFamily: fonts.dmMono }}>
                    {formatPHP(items.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((exp, idx) => {
                    const meta = CATEGORY_META[exp.category] ?? CATEGORY_META.others;
                    return (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (gi * items.length + idx) * 0.03 }}
                        style={{
                          background: 'white', border: `1px solid ${meta.border}`,
                          borderRadius: borderRadius.md, padding: '12px 14px',
                          display: 'flex', alignItems: 'center', gap: '12px',
                          boxShadow: shadow.sm,
                        }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: meta.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                          border: `1.5px solid ${meta.border}`,
                        }}>
                          {meta.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exp.title || (exp.category.charAt(0).toUpperCase() + exp.category.slice(1))}
                          </p>
                          {exp.note && (
                            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exp.note}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: meta.color, fontFamily: fonts.dmMono, flexShrink: 0 }}>
                          {formatPHP(exp.amount)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: WALLET
      ══════════════════════════════════════════ */}
      {activeTab === 'wallet' && (
        <>
          <MonthNav />

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: spacing.xl }}>
            {[
              { label: 'Total Income', value: walletEntries.filter(w => w.type === 'income').reduce((s, w) => s + w.amount, 0), color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
              { label: 'Adjustments',  value: walletEntries.filter(w => w.type === 'adjustment').reduce((s, w) => s + w.amount, 0), color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
            ].map(card => (
              <div key={card.label} style={{
                background: card.bg, border: `1px solid ${card.border}`,
                borderRadius: borderRadius.md, padding: '14px', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: card.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 700, color: card.color, fontFamily: fonts.dmMono }}>
                  {formatPHP(card.value)}
                </p>
              </div>
            ))}
          </div>

          {loadingWallet ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
          ) : walletEntries.length === 0 ? (
            <EmptyState message="No wallet entries this month" />
          ) : (
            Object.entries(groupedWallet).map(([dateKey, items], gi) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (gi * items.length + idx) * 0.03 }}
                      style={{
                        background: 'white',
                        border: `1px solid ${entry.type === 'income' ? '#86efac' : '#d1d5db'}`,
                        borderRadius: borderRadius.md, padding: '12px 14px',
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
                      <span style={{ fontSize: '15px', fontWeight: 700, color: entry.type === 'income' ? '#16a34a' : '#6b7280', fontFamily: fonts.dmMono, flexShrink: 0 }}>
                        +{formatPHP(entry.amount)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: GOALS
      ══════════════════════════════════════════ */}
      {activeTab === 'goals' && (
        <>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',     value: goals.length,                                   color: '#7c3aed' },
              { label: 'Active',    value: goals.filter(g => g.status === 'active').length,    color: '#7c3aed' },
              { label: 'Completed', value: goals.filter(g => g.status === 'completed').length, color: '#16a34a' },
            ].map(chip => (
              <div key={chip.label} style={{
                background: 'white', border: '1px solid #e9d5ff',
                borderRadius: borderRadius.lg, padding: `${spacing.xs} ${spacing.md}`,
                fontSize: '12px', color: chip.color, fontWeight: 600,
              }}>
                {chip.value} {chip.label}
              </div>
            ))}
          </div>

          {/* Overall progress banner */}
          {goals.filter(g => g.status === 'active').length > 0 && (() => {
            const activeGoals  = goals.filter(g => g.status === 'active');
            const totalTarget  = activeGoals.reduce((s, g) => s + g.target_amount, 0);
            const totalSaved   = activeGoals.reduce((s, g) => s + g.saved_amount, 0);
            const overallPct   = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
            return (
              <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)',
                borderRadius: borderRadius.lg, padding: spacing.xl,
                marginBottom: spacing.xl, color: 'white',
              }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                  Overall progress — {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Saved</p>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, fontFamily: fonts.dmMono, color: '#34d399' }}>
                      {formatPHP(totalSaved)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Target</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, fontFamily: fonts.dmMono, color: '#a78bfa' }}>
                      {formatPHP(totalTarget)}
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '999px', background: '#34d399' }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Goal filter */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: spacing.xl,
            background: '#f3f4f6', borderRadius: borderRadius.md, padding: '4px',
          }}>
            {GOAL_FILTER_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setGoalFilter(opt)}
                style={{
                  flex: 1, padding: '6px 8px', border: 'none',
                  borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: fonts.dmSans,
                  background: goalFilter === opt ? 'white' : 'transparent',
                  color: goalFilter === opt ? '#7c3aed' : '#6b7280',
                  boxShadow: goalFilter === opt ? shadow.sm : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {loadingGoals ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
          ) : filteredGoals.length === 0 ? (
            <EmptyState message={goalFilter === 'All' ? 'No goals yet' : `No ${goalFilter.toLowerCase()} goals`} />
          ) : (
            Object.entries(groupedGoals).map(([dateKey, items], gi) => (
              <div key={dateKey} style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{dateKey}</span>
                  <div style={{ flex: 1, height: '1px', background: '#e9d5ff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((goal, idx) => {
                    const isCompleted = goal.status === 'completed';
                    const statusMeta  = GOAL_STATUS_META[goal.status];
                    const daysLeft    = goal.target_date
                      ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isOverdue   = daysLeft !== null && daysLeft < 0 && !isCompleted;

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (gi * items.length + idx) * 0.04 }}
                        style={{
                          background: 'white',
                          border: `1.5px solid ${isCompleted ? '#86efac' : isOverdue ? '#fca5a5' : '#e9d5ff'}`,
                          borderRadius: borderRadius.lg,
                          padding: '16px',
                          boxShadow: shadow.sm,
                        }}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '26px' }}>{goal.emoji}</span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{goal.title}</p>
                              {goal.target_date ? (
                                <p style={{ margin: 0, fontSize: '11px', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 700 : 400 }}>
                                  {isOverdue
                                    ? `Overdue by ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? 's' : ''}`
                                    : daysLeft === 0 ? 'Due today!'
                                    : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                                </p>
                              ) : (
                                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                                  Created {new Date(goal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                            borderRadius: '999px', background: statusMeta.bg, color: statusMeta.color,
                            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                          }}>
                            {statusMeta.label}
                          </span>
                        </div>

                        {/* Amounts */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: isCompleted ? '#16a34a' : '#7c3aed', fontFamily: 'monospace' }}>
                            {formatPHP(goal.saved_amount)}
                          </span>
                          <span style={{ fontSize: '13px', color: '#9ca3af', fontFamily: 'monospace' }}>
                            of {formatPHP(goal.target_amount)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut', delay: (gi * items.length + idx) * 0.04 }}
                            style={{
                              height: '100%', borderRadius: '999px',
                              background: isCompleted
                                ? '#16a34a'
                                : goal.progress >= 75 ? '#7c3aed'
                                : goal.progress >= 40 ? '#a78bfa'
                                : '#c4b5fd',
                            }}
                          />
                        </div>

                        {/* Footer */}
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                          {goal.progress}% — {isCompleted ? 'Goal reached! 🎉' : `${formatPHP(goal.remaining)} to go`}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ── Add Payment Modal ── */}
      {paymentModal && (
        <AddPaymentModal
          debtId={paymentModal.debtId}
          isOpen={true}
          personName={paymentModal.personName}
          remaining={paymentModal.remaining}
          onClose={() => setPaymentModal(null)}
          onSuccess={(debtId, newStatus) => { fetchDebts(); setPaymentModal(null); }}
        />
      )}
    </div>
  );
}