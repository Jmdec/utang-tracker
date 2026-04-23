'use client';

import { useState, useEffect } from 'react';
import { colors, fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { useDataStore } from '@/lib/store';
import { motion } from 'framer-motion';
import DebtCard from '../DebtCard';

type MonthlySummary = {
  income: number;
  expenses: number;
  net: number;
};

type ExpenseSummary = {
  grand_total: number;
  by_category: Record<string, { total: number; count: number }>;
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', transport: '🚌', bills: '⚡', health: '💊',
  entertainment: '🎮', shopping: '🛍️', education: '📚', others: '📌',
};

function formatPHP(n: number) {
  return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function Dashboard() {
  const { debts, setDebts } = useDataStore();
  const [loading, setLoading]               = useState(true);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [expSummary, setExpSummary]         = useState<ExpenseSummary | null>(null);

  useEffect(() => {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [debtsRes, walletRes, expRes] = await Promise.all([
          fetch('/api/debts'),
          fetch(`/api/wallet/monthly-summary?month=${month}&year=${year}`),
          fetch(`/api/expenses/summary?month=${month}&year=${year}`),
        ]);

        if (debtsRes.ok) {
          const data = await debtsRes.json();
          const apiDebts = data.debts ?? [];
          setDebts(apiDebts.map((debt: any) => ({
            id: debt.id.toString(),
            userId: '1',
            personName: debt.person_name,
            amount: debt.amount,
            type: debt.type,
            description: debt.description ?? undefined,
            status: debt.status,
            dueDate: debt.due_date ?? undefined,
            createdAt: debt.created_at,
            updatedAt: debt.updated_at,
          })));
        }

        if (walletRes.ok) {
          const d = await walletRes.json();
          setMonthlySummary({ income: d.income, expenses: d.expenses, net: d.net });
        }

        if (expRes.ok) {
          const d = await expRes.json();
          setExpSummary(d.summary ?? null);
        }
      } catch {
        // silently fall back to store data
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
  const totalLent     = debts.filter(d => d.type === 'lent'     && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
  const netDebt       = totalLent - totalBorrowed;
  const recentDebts   = debts.slice(0, 3);

  const now        = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long' });

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{ color: '#5b21b6', marginTop: 0, marginBottom: spacing.md, fontSize: '24px', fontWeight: 700 }}>
          Dashboard
        </h2>
        <p style={{ color: '#7c3aed', margin: 0, fontSize: '14px' }}>
          Here&apos;s your financial overview
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
      ) : (
        <>
          {/* ── Monthly wallet summary ── */}
          {monthlySummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)',
                borderRadius: borderRadius.lg,
                padding: spacing.xl,
                marginBottom: spacing.xl,
                color: 'white',
              }}
            >
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                {monthLabel} — income vs spending
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '12px',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Net</p>
                  <p style={{
                    margin: 0, fontSize: '28px', fontWeight: 700, fontFamily: fonts.dmMono,
                    color: monthlySummary.net >= 0 ? '#34d399' : '#f87171',
                  }}>
                    {monthlySummary.net >= 0 ? '+' : ''}{formatPHP(monthlySummary.net)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: spacing.lg, textAlign: 'right' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Income</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, fontFamily: fonts.dmMono, color: '#34d399' }}>
                      {formatPHP(monthlySummary.income)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Spent</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, fontFamily: fonts.dmMono, color: '#f87171' }}>
                      {formatPHP(monthlySummary.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Debt stats ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.xl }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: netDebt >= 0
                  ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                  : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                border: `2px solid ${netDebt >= 0 ? '#a78bfa' : '#f472b6'}`,
                borderRadius: borderRadius.lg,
                padding: spacing.xl,
                textAlign: 'center' as const,
              }}
            >
              <p style={{ margin: 0, color: '#7c3aed', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>
                Personal Finance Tracker Net Balance
              </p>
              <p style={{ margin: 0, marginTop: spacing.md, fontSize: '32px', fontWeight: 700, color: netDebt >= 0 ? '#7c3aed' : '#ec4899', fontFamily: fonts.dmMono }}>
                {formatPHP(netDebt)}
              </p>
              <p style={{ margin: 0, marginTop: spacing.xs, fontSize: '12px', color: '#7c3aed' }}>
                {netDebt > 0 ? 'People owe you' : netDebt < 0 ? 'You owe people' : 'All settled up 🎉'}
              </p>
            </motion.div>

            <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  flex: 1, minWidth: '140px',
                  background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                  border: '1px solid #f472b6',
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  textAlign: 'center' as const,
                }}
              >
                <p style={{ margin: 0, color: '#be185d', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>I OWE</p>
                <p style={{ margin: 0, marginTop: spacing.md, fontSize: '22px', fontWeight: 700, color: '#ec4899', fontFamily: fonts.dmMono }}>
                  {formatPHP(totalBorrowed)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  flex: 1, minWidth: '140px',
                  background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                  border: '1px solid #a78bfa',
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  textAlign: 'center' as const,
                }}
              >
                <p style={{ margin: 0, color: '#6d28d9', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>THEY OWE</p>
                <p style={{ margin: 0, marginTop: spacing.md, fontSize: '22px', fontWeight: 700, color: '#8b5cf6', fontFamily: fonts.dmMono }}>
                  {formatPHP(totalLent)}
                </p>
              </motion.div>
            </div>
          </div>

          {/* ── Top expenses this month ── */}
          {expSummary && expSummary.grand_total > 0 && (
            <div style={{ marginBottom: spacing.xl }}>
              <h3 style={{ margin: '0 0 12px', color: '#5b21b6', fontSize: '16px', fontWeight: 600 }}>
                Top expenses — {monthLabel}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(expSummary.by_category)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .slice(0, 4)
                  .map(([cat, data]) => {
                    const pct = (data.total / expSummary.grand_total) * 100;
                    return (
                      <div
                        key={cat}
                        style={{
                          background: 'white', border: '1px solid #e9d5ff',
                          borderRadius: borderRadius.md, padding: '10px 14px',
                          boxShadow: shadow.sm,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{CATEGORY_EMOJI[cat] ?? '📌'}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b0764', textTransform: 'capitalize' }}>{cat}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', fontFamily: fonts.dmMono }}>
                            {formatPHP(data.total)}
                          </span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                            style={{ height: '100%', borderRadius: '999px', background: '#7c3aed' }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Recent debts ── */}
          <div style={{ marginBottom: spacing.xl }}>
            <h3 style={{ margin: '0 0 12px', color: '#5b21b6', fontSize: '16px', fontWeight: 600 }}>
              Recent Debts
            </h3>
            {recentDebts.length > 0 ? (
              <div>{recentDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}</div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: colors.bgCard,
                  border: `1px dashed ${colors.border}`,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  textAlign: 'center' as const,
                }}
              >
                <p style={{ margin: 0, color: '#7c3aed', fontSize: '14px' }}>No debts yet</p>
                <p style={{ margin: 0, marginTop: spacing.sm, color: '#7c3aed', fontSize: '12px' }}>
                  Start by adding a contact and creating a debt
                </p>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}