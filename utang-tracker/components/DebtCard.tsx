'use client';

import { motion } from 'framer-motion';
import { colors, fonts, spacing, borderRadius, shadow, badgeStyle } from '@/lib/design';
import { Debt, useDataStore } from '@/lib/store';

interface DebtCardProps {
  debt: Debt;
}

export default function DebtCard({ debt }: DebtCardProps) {
  const { deleteDebt } = useDataStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partially_paid':
        return 'warning';
      default:
        return 'danger';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partially_paid':
        return 'Partial';
      default:
        return 'Unpaid';
    }
  };

  const typeLabel = debt.type === 'borrowed' ? 'I Owe' : 'They Owe';
  const typeColor = debt.type === 'borrowed' ? '#db2777' : '#7c3aed';
  const subtextColor = debt.type === 'borrowed' ? '#9d174d' : '#5b21b6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        background: debt.type === 'borrowed' ? 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        border: `1px solid ${typeColor}`,
        borderLeft: `4px solid ${typeColor}`,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        cursor: 'pointer',
        boxShadow: shadow.md,
        transition: `all ${200}ms ease-in-out`,
        transform: 'rotate(-0.5deg)',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: shadow.lg,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <div>
          <h3 style={{ margin: 0, color: '#3b0764', fontSize: '15px', fontWeight: 600, fontFamily: fonts.dmSans }}>
            {debt.personName}
          </h3>
          <p style={{ margin: 0, marginTop: spacing.xs, color: subtextColor, fontSize: '12px', fontFamily: fonts.dmSans }}>
            {debt.description || 'No description'}
          </p>
        </div>
        <div style={{
          ...badgeStyle(getStatusColor(debt.status) as any),
          fontSize: '11px',
        }}>
          {getStatusLabel(debt.status)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.md }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: typeColor, fontFamily: fonts.dmMono }}>
          ₱{debt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <span style={{ fontSize: '12px', color: subtextColor, fontWeight: 600, fontFamily: fonts.dmSans }}>
          {typeLabel}
        </span>
      </div>

      {debt.dueDate && (
        <div style={{
          borderTop: `1px dashed ${typeColor}`,
          paddingTop: spacing.md,
          marginTop: spacing.md,
          fontSize: '12px',
          color: subtextColor,
          fontWeight: 500,
          fontFamily: fonts.dmSans,
        }}>
          Due: {new Date(debt.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
        <button
          onClick={() => deleteDebt(debt.id)}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'transparent',
            color: '#be123c',
            border: `1px solid #be123c`,
            borderRadius: borderRadius.sm,
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: `all ${200}ms ease-in-out`,
            fontFamily: fonts.dmSans,
          }}
        >
          Delete
        </button>
      </div> */}
    </motion.div>
  );
}