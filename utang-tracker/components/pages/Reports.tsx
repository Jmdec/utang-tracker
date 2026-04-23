'use client';

import { useState, useEffect, useCallback } from 'react';
import { fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
type DebtSummary = {
  total_borrowed: number;
  total_lent: number;
  net_balance: number;
};

type ExpenseSummary = {
  grand_total: number;
  by_category: Record<string, { total: number; count: number }>;
  by_day: Record<string, number>;
};

type WalletSummary = {
  income: number;
  expenses: number;
  net: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  food:          { emoji: '🍜', color: '#d97706' },
  transport:     { emoji: '🚌', color: '#2563eb' },
  bills:         { emoji: '⚡', color: '#dc2626' },
  health:        { emoji: '💊', color: '#16a34a' },
  entertainment: { emoji: '🎮', color: '#9333ea' },
  shopping:      { emoji: '🛍️', color: '#ec4899' },
  education:     { emoji: '📚', color: '#0891b2' },
  others:        { emoji: '📌', color: '#6b7280' },
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function DayBarChart({ byDay }: { byDay: Record<string, number> }) {
  const entries = Object.entries(byDay);
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px', marginTop: '12px' }}>
      {entries.map(([date, val]) => {
        const pct = (val / max) * 100;
        const day = new Date(date + 'T00:00:00').getDate();
        return (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              style={{
                width: '100%', minHeight: '2px',
                background: '#7c3aed', borderRadius: '2px 2px 0 0', opacity: 0.7,
              }}
            />
            {entries.length <= 15 && (
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>{day}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const SIZE = 120, R = 46, STROKE = 18;
  const CX = SIZE / 2, CY = SIZE / 2;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const slices = data.map(d => {
    const pct   = d.value / total;
    const dash  = pct * circ;
    const gap   = circ - dash;
    const slice = { ...d, pct, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={s.color}
          strokeWidth={STROKE}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
        />
      ))}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Reports() {
  const { month: nowMonth, year: nowYear } = getNow();
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear]   = useState(nowYear);

  const [debtSummary,    setDebtSummary]    = useState<DebtSummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [walletSummary,  setWalletSummary]  = useState<WalletSummary | null>(null);
  const [loading, setLoading]               = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, eRes, wRes] = await Promise.all([
        fetch('/api/debts/summary'),
        fetch(`/api/expenses/summary?month=${month}&year=${year}`),
        fetch(`/api/wallet/monthly-summary?month=${month}&year=${year}`),
      ]);
      if (dRes.ok) { const d = await dRes.json(); setDebtSummary(d.summary); }
      if (eRes.ok) { const d = await eRes.json(); setExpenseSummary(d.summary); }
      if (wRes.ok) { const d = await wRes.json(); setWalletSummary(d); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  // Donut data
  const donutData = expenseSummary
    ? Object.entries(expenseSummary.by_category)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([cat, d]) => ({
          label: cat,
          value: d.total,
          color: CATEGORY_META[cat]?.color ?? '#6b7280',
        }))
    : [];

  const total = expenseSummary?.grand_total ?? 0;

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '24px', fontWeight: 700 }}>Reports</h2>
        <p style={{ color: '#6b7280', margin: 0, marginTop: '4px', fontSize: '14px' }}>
          Your financial breakdown
        </p>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing.md,
        background: 'white', borderRadius: borderRadius.md,
        border: '1px solid #e9d5ff', padding: `${spacing.sm} ${spacing.md}`,
        width: 'fit-content', marginBottom: spacing.xl,
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
      ) : (
        <>
          {/* ── Income vs Expenses ── */}
          {walletSummary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'white', border: '1px solid #e9d5ff',
                borderRadius: borderRadius.lg, padding: spacing.xl,
                marginBottom: spacing.xl, boxShadow: shadow.md,
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                Income vs Expenses
              </h3>

              {/* Progress bar: expenses / income */}
              {walletSummary.income > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Spent {walletSummary.income > 0 ? Math.round((walletSummary.expenses / walletSummary.income) * 100) : 0}% of income
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: walletSummary.net >= 0 ? '#16a34a' : '#dc2626' }}>
                      {walletSummary.net >= 0 ? 'Saved' : 'Over'} {formatPHP(Math.abs(walletSummary.net))}
                    </span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((walletSummary.expenses / walletSummary.income) * 100, 100)}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: '999px',
                        background: walletSummary.expenses > walletSummary.income
                          ? '#dc2626' : 'linear-gradient(90deg, #7c3aed, #ec4899)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Income',   value: walletSummary.income,   color: '#16a34a' },
                  { label: 'Expenses', value: walletSummary.expenses, color: '#dc2626' },
                  { label: 'Net',      value: walletSummary.net,      color: walletSummary.net >= 0 ? '#7c3aed' : '#dc2626' },
                ].map(card => (
                  <div key={card.label} style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: card.color, fontFamily: fonts.dmMono }}>
                      {card.value >= 0 ? '' : '-'}{formatPHP(Math.abs(card.value))}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Expense breakdown ── */}
          {expenseSummary && total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'white', border: '1px solid #e9d5ff',
                borderRadius: borderRadius.lg, padding: spacing.xl,
                marginBottom: spacing.xl, boxShadow: shadow.md,
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                Spending by Category
              </h3>

              {/* Donut + legend */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <DonutChart data={donutData} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>TOTAL</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', fontFamily: fonts.dmMono }}>
                      {formatPHP(total)}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                  {donutData.slice(0, 5).map(d => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#374151', textTransform: 'capitalize', flex: 1 }}>{d.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a2e', fontFamily: fonts.dmMono }}>
                        {formatPHP(d.value)}
                      </span>
                    </div>
                  ))}
                  {donutData.length > 5 && (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{donutData.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Day bars */}
              {expenseSummary.by_day && Object.keys(expenseSummary.by_day).length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Daily spending
                  </p>
                  <DayBarChart byDay={expenseSummary.by_day} />
                </div>
              )}
            </motion.div>
          )}

          {/* ── Debt summary ── */}
          {debtSummary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: 'white', border: '1px solid #e9d5ff',
                borderRadius: borderRadius.lg, padding: spacing.xl,
                marginBottom: spacing.xl, boxShadow: shadow.md,
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                Personal Finance Tracker Overview (all time)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { label: 'I owe',     value: debtSummary.total_borrowed, color: '#ec4899' },
                  { label: 'They owe',  value: debtSummary.total_lent,     color: '#7c3aed' },
                  { label: 'Net',       value: debtSummary.net_balance,    color: debtSummary.net_balance >= 0 ? '#16a34a' : '#dc2626' },
                ].map(card => (
                  <div
                    key={card.label}
                    style={{
                      background: '#fafafa', border: '1px solid #f3f4f6',
                      borderRadius: borderRadius.md, padding: '12px', textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: card.color, fontFamily: fonts.dmMono }}>
                      {formatPHP(Math.abs(card.value))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Net bar */}
              {(debtSummary.total_borrowed > 0 || debtSummary.total_lent > 0) && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Borrowed vs Lent</p>
                  <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', overflow: 'hidden', display: 'flex' }}>
                    {(() => {
                      const total = debtSummary.total_borrowed + debtSummary.total_lent;
                      const borrowedPct = total > 0 ? (debtSummary.total_borrowed / total) * 100 : 0;
                      const lentPct     = 100 - borrowedPct;
                      return (
                        <>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${borrowedPct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', background: '#ec4899' }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${lentPct}%` }}     transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} style={{ height: '100%', background: '#7c3aed' }} />
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#ec4899', fontWeight: 600 }}>Borrowed</span>
                    <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 600 }}>Lent</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Empty state */}
          {!expenseSummary?.grand_total && !debtSummary?.total_borrowed && !debtSummary?.total_lent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'white', border: '1px dashed #e9d5ff',
                borderRadius: borderRadius.lg, padding: spacing.xl, textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#7c3aed', fontSize: '14px' }}>No data yet for this period</p>
              <p style={{ margin: 0, marginTop: '4px', color: '#a78bfa', fontSize: '12px' }}>
                Log some expenses or debts to see your reports
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}