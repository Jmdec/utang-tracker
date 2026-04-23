'use client';

import { useState, useEffect, useCallback } from 'react';
import { fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { motion, AnimatePresence } from 'framer-motion';

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

function formatPHP(n: number) {
  return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EMOJI_OPTIONS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '💍', '🎓', '🏖️', '💰', '🛡️', '🎸'];

const STATUS_META = {
  active:    { bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff', label: 'Active'    },
  completed: { bg: '#dcfce7', color: '#16a34a', border: '#86efac', label: 'Completed' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db', label: 'Cancelled' },
};

export default function Goals() {
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Add form
  const [title, setTitle]           = useState('');
  const [emoji, setEmoji]           = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount]   = useState('');
  const [targetDate, setTargetDate]     = useState('');
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');

  // Contribute form
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing]         = useState(false);
  const [contributeError, setContributeError]   = useState('');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) { const d = await res.json(); setGoals(d.goals ?? []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const resetForm = () => {
    setTitle(''); setEmoji('🎯'); setTargetAmount('');
    setSavedAmount(''); setTargetDate(''); setFormError('');
  };

  const handleAdd = async () => {
    if (!title.trim()) { setFormError('Enter a goal title.'); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { setFormError('Enter a valid target amount.'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          emoji,
          target_amount: parseFloat(targetAmount),
          saved_amount: savedAmount ? parseFloat(savedAmount) : 0,
          target_date: targetDate || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.message ?? 'Failed.'); return; }
      resetForm(); setShowAdd(false); fetchGoals();
    } catch { setFormError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      setContributeError('Enter a valid amount.'); return;
    }
    setContributing(true); setContributeError('');
    try {
      const res = await fetch(`/api/goals/${contributeGoal!.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(contributeAmount) }),
      });
      if (!res.ok) { const d = await res.json(); setContributeError(d.message ?? 'Failed.'); return; }
      setContributeAmount(''); setContributeGoal(null); fetchGoals();
    } catch { setContributeError('Network error.'); }
    finally { setContributing(false); }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) setGoals(prev => prev.filter(g => g.id !== id));
    } finally { setDeleteId(null); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    fontFamily: fonts.dmSans, border: '1.5px solid #e5e7eb',
    borderRadius: '8px', outline: 'none', background: 'white',
    color: '#1a1a2e', boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: '#6b7280', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  };

  const activeGoals    = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved  = activeGoals.reduce((s, g) => s + g.saved_amount, 0);

  return (
    <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <div>
            <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '24px', fontWeight: 700 }}>Goals</h2>
            <p style={{ color: '#6b7280', margin: 0, marginTop: '4px', fontSize: '14px' }}>Track your savings targets</p>
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
            + New Goal
          </button>
        </div>

        {/* Overall progress summary */}
        {activeGoals.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)',
            borderRadius: borderRadius.lg, padding: spacing.xl, color: 'white',
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
                animate={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '999px', background: '#34d399' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Add Goal Form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: spacing.xl }}
          >
            <div style={{ background: 'white', border: '1.5px solid #e9d5ff', borderRadius: borderRadius.lg, padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>New Savings Goal</h4>

              {/* Emoji picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Icon</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        width: '40px', height: '40px', fontSize: '20px',
                        border: `2px solid ${emoji === e ? '#7c3aed' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        background: emoji === e ? '#f3e8ff' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Goal Title</label>
                <input
                  type="text" placeholder="e.g. Emergency Fund, New Laptop"
                  value={title} onChange={e => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Target Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 700, color: '#7c3aed' }}>₱</span>
                    <input
                      type="number" inputMode="decimal" placeholder="0.00"
                      value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '24px' }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Already Saved</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>₱</span>
                    <input
                      type="number" inputMode="decimal" placeholder="0.00"
                      value={savedAmount} onChange={e => setSavedAmount(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '24px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Target Date <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span></label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle} />
              </div>

              {formError && <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{formError}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { resetForm(); setShowAdd(false); }}
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontFamily: fonts.dmSans }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd} disabled={saving}
                  style={{ flex: 2, padding: '10px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', background: saving ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: fonts.dmSans }}
                >
                  {saving ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: '#7c3aed', fontSize: '14px' }}>Loading...</div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'white', border: '1px dashed #e9d5ff', borderRadius: borderRadius.lg, padding: spacing.xl, textAlign: 'center' }}
        >
          <p style={{ margin: 0, fontSize: '32px' }}>🎯</p>
          <p style={{ margin: '8px 0 0', color: '#7c3aed', fontSize: '14px', fontWeight: 600 }}>No goals yet</p>
          <p style={{ margin: '4px 0 0', color: '#a78bfa', fontSize: '12px' }}>Create your first savings goal above</p>
        </motion.div>
      ) : (
        <>
          {/* ── Active Goals ── */}
          {activeGoals.length > 0 && (
            <div style={{ marginBottom: spacing.xl }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#374151' }}>
                Active — {activeGoals.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeGoals.map((goal, idx) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    idx={idx}
                    onContribute={() => { setContributeGoal(goal); setContributeAmount(''); setContributeError(''); }}
                    onDelete={() => handleDelete(goal.id)}
                    isDeleting={deleteId === goal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Completed Goals ── */}
          {completedGoals.length > 0 && (
            <div style={{ marginBottom: spacing.xl }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#374151' }}>
                Completed 🎉 — {completedGoals.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {completedGoals.map((goal, idx) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    idx={idx}
                    onContribute={() => {}}
                    onDelete={() => handleDelete(goal.id)}
                    isDeleting={deleteId === goal.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Contribute Modal ── */}
      <AnimatePresence>
        {contributeGoal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
            onClick={e => { if (e.target === e.currentTarget) setContributeGoal(null); }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ background: '#fafafa', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '560px', padding: '24px 20px 40px', fontFamily: fonts.dmSans }}
            >
              <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 20px' }} />
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
                {contributeGoal.emoji} Add to {contributeGoal.title}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
                {formatPHP(contributeGoal.saved_amount)} saved of {formatPHP(contributeGoal.target_amount)}
              </p>

              <label style={labelStyle}>Amount</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>₱</span>
                <input
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={contributeAmount} onChange={e => setContributeAmount(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '28px', fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}
                />
              </div>

              {contributeError && <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{contributeError}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setContributeGoal(null)}
                  style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e5e7eb', borderRadius: '10px', background: 'white', color: '#374151', cursor: 'pointer', fontFamily: fonts.dmSans }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleContribute} disabled={contributing}
                  style={{ flex: 2, padding: '12px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '10px', background: contributing ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', cursor: contributing ? 'not-allowed' : 'pointer', fontFamily: fonts.dmSans }}
                >
                  {contributing ? 'Saving...' : '+ Add Contribution'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Goal Card Sub-component ───────────────────────────────────────────────────
function GoalCard({ goal, idx, onContribute, onDelete, isDeleting }: {
  goal: Goal;
  idx: number;
  onContribute: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isCompleted = goal.status === 'completed';
  const statusMeta  = STATUS_META[goal.status];

  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        background: 'white',
        border: `1.5px solid ${isCompleted ? '#86efac' : isOverdue ? '#fca5a5' : '#e9d5ff'}`,
        borderRadius: borderRadius.lg,
        padding: '16px',
        boxShadow: '0 1px 4px rgba(124,58,237,0.08)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px' }}>{goal.emoji}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{goal.title}</p>
            {goal.target_date && (
              <p style={{ margin: 0, fontSize: '11px', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 700 : 400 }}>
                {isOverdue
                  ? `Overdue by ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? 's' : ''}`
                  : daysLeft === 0 ? 'Due today!'
                  : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 8px',
            borderRadius: '999px', background: statusMeta.bg, color: statusMeta.color,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {statusMeta.label}
          </span>
          <button
            onClick={onDelete} disabled={isDeleting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', padding: '2px', lineHeight: 1, opacity: isDeleting ? 0.4 : 1 }}
          >✕</button>
        </div>
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
      <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.05 }}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {goal.progress}% — {isCompleted ? 'Goal reached! 🎉' : `${formatPHP(goal.remaining)} to go`}
        </span>
        {!isCompleted && (
          <button
            onClick={onContribute}
            style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: 700,
              border: 'none', borderRadius: '999px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            + Add
          </button>
        )}
      </div>
    </motion.div>
  );
}