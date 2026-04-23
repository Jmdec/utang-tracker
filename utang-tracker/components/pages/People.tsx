'use client';

import { useEffect, useState } from 'react';
import { colors, fonts, spacing, borderRadius, shadow } from '@/lib/design';
import { useDataStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type ApiDebt = {
  id: string;
  person_name: string;
  amount: number;
  type: 'borrowed' | 'lent';
  status: string;
  remaining: number;
};

type DialogState = {
  open: boolean;
  contactId: string | null;
  contactName: string;
};

export default function People() {
  const { contacts, setContacts, deleteContact } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiDebts, setApiDebts] = useState<ApiDebt[]>([]);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    contactId: null,
    contactName: '',
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [contactsRes, debtsRes] = await Promise.all([
          fetch('/api/contacts', { headers: { 'Accept': 'application/json' } }),
          fetch('/api/debts', { headers: { 'Accept': 'application/json' } }),
        ]);

        if (contactsRes.status === 401) {
          setError('Session expired. Please log in again.');
          return;
        }

        if (!contactsRes.ok) {
          setError('Failed to load contacts.');
          return;
        }

        const contactsData = await contactsRes.json();
        setContacts(
          (contactsData.contacts ?? []).map((c: any) => ({
            id: c.id.toString(),
            userId: c.user_id?.toString() ?? '1',
            name: c.name,
            phone: c.phone ?? undefined,
            email: c.email ?? undefined,
            notes: c.notes ?? undefined,
            createdAt: c.created_at,
          }))
        );

        if (debtsRes.ok) {
          const debtsData = await debtsRes.json();
          setApiDebts(debtsData.debts ?? []);
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const openDeleteDialog = (id: string, name: string) => {
    setDialog({ open: true, contactId: id, contactName: name });
  };

  const closeDialog = () => {
    if (deleting) return;
    setDialog({ open: false, contactId: null, contactName: '' });
  };

  const confirmDelete = async () => {
    if (!dialog.contactId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${dialog.contactId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        closeDialog();
        setTimeout(() => alert('Failed to delete contact.'), 100);
        return;
      }

      deleteContact(dialog.contactId);
      closeDialog();
    } catch {
      closeDialog();
      setTimeout(() => alert('Network error. Could not delete contact.'), 100);
    } finally {
      setDeleting(false);
    }
  };

  const getPersonBalance = (contactName: string) => {
    const personDebts = apiDebts.filter(
      (d) => d.person_name === contactName && d.status !== 'paid'
    );
    const borrowed = personDebts
      .filter((d) => d.type === 'borrowed')
      .reduce((sum, d) => sum + d.remaining, 0);
    const lent = personDebts
      .filter((d) => d.type === 'lent')
      .reduce((sum, d) => sum + d.remaining, 0);
    return lent - borrowed;
  };

  const txt = {
    heading: '#1a1a2e',
    body:    '#2d2d44',
    sub:     '#5a5a7a',
    note:    '#4a4a66',
    noteTxt: '#3d3d58',
  };

  return (
    <>
      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent
          showCloseButton={false}
          style={{ fontFamily: fonts.dmSans }}
        >
          <DialogHeader>
            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 4px',
              fontSize: '22px',
            }}>
              🗑️
            </div>

            <DialogTitle style={{
              textAlign: 'center',
              fontSize: '17px',
              fontWeight: 700,
              color: txt.heading,
            }}>
              Delete Contact
            </DialogTitle>

            <DialogDescription style={{
              textAlign: 'center',
              fontSize: '14px',
              color: txt.sub,
              lineHeight: '1.5',
            }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: txt.body }}>{dialog.contactName}</strong>?
              {' '}This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter style={{ display: 'flex', gap: spacing.sm }}>
            <button
              onClick={closeDialog}
              disabled={deleting}
              style={{
                flex: 1,
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                fontWeight: 600,
                color: txt.body,
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: fonts.dmSans,
                opacity: deleting ? 0.5 : 1,
                transition: 'opacity 200ms',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{
                flex: 1,
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: deleting ? '#fca5a5' : colors.danger,
                border: 'none',
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: fonts.dmSans,
                transition: 'background-color 200ms',
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Page Content ── */}
      <div style={{ padding: spacing.lg, fontFamily: fonts.dmSans, maxWidth: '100%' }}>
        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{
            color: txt.heading,
            marginTop: 0,
            marginBottom: spacing.md,
            fontSize: '24px',
            fontWeight: 700,
          }}>
            People
          </h2>
          <p style={{ color: txt.sub, margin: 0, fontSize: '14px' }}>
            People you&apos;ve lent to or borrowed from
          </p>
        </div>

        {loading && (
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px dashed ${colors.border}`,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, color: txt.sub, fontSize: '14px' }}>Loading contacts...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: spacing.md,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: borderRadius.md,
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: spacing.md,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div>
            {contacts.length > 0 ? (
              contacts.map((contact) => {
                const balance = getPersonBalance(contact.name);
                const initials = contact.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      padding: spacing.lg,
                      marginBottom: spacing.md,
                      boxShadow: shadow.md,
                      transform: 'rotate(-0.5deg)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.lg,
                      marginBottom: spacing.lg,
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: borderRadius.full,
                        backgroundColor: colors.brand,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        fontFamily: fonts.dmSans,
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>

                      {/* Name + Phone */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: 0,
                          color: txt.heading,
                          fontSize: '16px',
                          fontWeight: 700,
                          fontFamily: fonts.dmSans,
                        }}>
                          {contact.name}
                        </h3>
                        {contact.phone && (
                          <p style={{
                            margin: 0,
                            marginTop: spacing.xs,
                            color: txt.body,
                            fontSize: '13px',
                            fontFamily: fonts.dmSans,
                          }}>
                            {contact.phone}
                          </p>
                        )}
                      </div>

                      {/* Balance badge */}
                      <div style={{ textAlign: 'right' as const }}>
                        {balance !== 0 ? (
                          <>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 700,
                              color: balance > 0 ? colors.success : colors.danger,
                              fontFamily: fonts.dmMono,
                            }}>
                              {balance > 0 && '+ '}
                              ₱{Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p style={{ margin: 0, marginTop: spacing.xs, fontSize: '11px', color: txt.sub }}>
                              {balance > 0 ? 'owes you' : 'you owe'}
                            </p>
                          </>
                        ) : (
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                            ✅ Settled
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {contact.notes && (
                      <div style={{
                        borderTop: `1px dashed ${colors.border}`,
                        paddingTop: spacing.md,
                        marginTop: spacing.md,
                        marginBottom: spacing.md,
                        fontSize: '13px',
                        color: txt.noteTxt,
                        fontFamily: fonts.dmSans,
                      }}>
                        <strong style={{ color: txt.note }}>Notes:</strong>{' '}{contact.notes}
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => openDeleteDialog(contact.id, contact.name)}
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: 'transparent',
                        color: colors.danger,
                        border: `1px solid ${colors.danger}`,
                        borderRadius: borderRadius.sm,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 200ms ease-in-out',
                        fontFamily: fonts.dmSans,
                      }}
                    >
                      Delete
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px dashed ${colors.border}`,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  textAlign: 'center' as const,
                }}
              >
                <p style={{ margin: 0, color: txt.body, fontSize: '14px' }}>No people yet</p>
                <p style={{ margin: 0, marginTop: spacing.sm, color: txt.sub, fontSize: '12px' }}>
                  Add a contact to get started
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
}