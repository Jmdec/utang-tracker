'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { colors, fonts, spacing, borderRadius, labelStyle, inputStyle, buttonStyle } from '@/lib/design';
import { useDebts } from '@/lib/hooks';

const debtSchema = z.object({
  personName: z.string().min(1, 'Please enter a name'),
  amount: z.string().min(1, 'Amount is required'),
  type: z.enum(['borrowed', 'lent']),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type DebtFormData = z.infer<typeof debtSchema>;

interface AddDebtFormProps {
  onSubmit: (data: DebtFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function AddDebtForm({ onSubmit, isLoading = false, onCancel }: AddDebtFormProps) {
  const { debts } = useDebts();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const personName = watch('personName');

  // Get unique names from previous debts for autocomplete
  const uniqueNames = Array.from(
    new Set(debts.map((d) => d.personName).filter((name) => name && name.toLowerCase() !== personName?.toLowerCase()))
  );

  const filteredSuggestions = personName
    ? uniqueNames.filter((name) =>
        name.toLowerCase().includes(personName.toLowerCase())
      )
    : [];

  const onSubmitForm = async (data: DebtFormData) => {
    await onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        fontFamily: fonts.dmSans,
      }}
    >
      <div>
        <label style={labelStyle}>Person&apos;s Name</label>
        <div style={{ position: 'relative' }}>
          <input
            {...register('personName')}
            placeholder="e.g., Juan, Maria, etc."
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{
              ...inputStyle,
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: colors.dark,
              color: colors.light,
              fontSize: '14px',
            } as React.CSSProperties}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: colors.dark,
                border: `1px solid ${colors.border}`,
                borderTop: 'none',
                borderRadius: `0 0 ${borderRadius.md} ${borderRadius.md}`,
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 10,
              }}
            >
              {filteredSuggestions.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const inputs = document.querySelectorAll('input[type="text"]');
                    const nameInput = inputs[0] as HTMLInputElement;
                    if (nameInput) nameInput.value = name;
                    setShowSuggestions(false);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    backgroundColor: 'transparent',
                    color: colors.light,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: `1px solid ${colors.border}`,
                    transition: `background-color ${150}ms ease`,
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.personName && (
          <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
            {errors.personName.message}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: spacing.md }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer', fontFamily: fonts.dmSans }}>
            <input type="radio" {...register('type')} value="borrowed" />
            <span style={{ color: colors.light, fontSize: '14px' }}>I Owe</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer', fontFamily: fonts.dmSans }}>
            <input type="radio" {...register('type')} value="lent" defaultChecked />
            <span style={{ color: colors.light, fontSize: '14px' }}>They Owe</span>
          </label>
        </div>
        {errors.type && (
          <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
            {errors.type.message}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Amount (₱)</label>
        <input
          {...register('amount')}
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          style={{
            ...inputStyle,
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: colors.dark,
            color: colors.light,
            fontSize: '14px',
          } as React.CSSProperties}
        />
        {errors.amount && (
          <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
            {errors.amount.message}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Description (Optional)</label>
        <textarea
          {...register('description')}
          placeholder="e.g., Borrowed for groceries"
          style={{
            ...inputStyle,
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: colors.dark,
            color: colors.light,
            fontSize: '14px',
            minHeight: '80px',
            fontFamily: fonts.dmSans,
            resize: 'vertical',
          } as React.CSSProperties}
        />
      </div>

      <div>
        <label style={labelStyle}>Due Date (Optional)</label>
        <input
          {...register('dueDate')}
          type="date"
          style={{
            ...inputStyle,
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: colors.dark,
            color: colors.light,
            fontSize: '14px',
          } as React.CSSProperties}
        />
      </div>

      <div style={{ display: 'flex', gap: spacing.md }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...buttonStyle('primary'),
            flex: 1,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          } as React.CSSProperties}
        >
          {isLoading ? 'Adding...' : 'Add Debt'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...buttonStyle('ghost'),
              flex: 1,
            } as React.CSSProperties}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
