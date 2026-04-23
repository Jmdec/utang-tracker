'use client';

import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  personName: string;
  amount: number;
  type: 'borrowed' | 'lent';
  status: 'unpaid' | 'partially_paid' | 'paid';
  description?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  description?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null, // token lives in httpOnly cookie, not localStorage
  isLoading: true, // start as loading until rehydrate completes
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    set({ user: null, token: null });
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  },
  rehydrate: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user ?? data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));

interface DataState {
  debts: Debt[];
  contacts: Contact[];
  payments: Map<string, Payment[]>;
  setDebts: (debts: Debt[]) => void;
  setContacts: (contacts: Contact[]) => void;
  setPayments: (debtId: string, payments: Payment[]) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  addPayment: (debtId: string, payment: Payment) => void;
}

export const useDataStore = create<DataState>((set) => ({
  debts: [],
  contacts: [],
  payments: new Map(),
  setDebts: (debts) => set({ debts }),
  setContacts: (contacts) => set({ contacts }),
  setPayments: (debtId, payments) =>
    set((state) => {
      const newPayments = new Map(state.payments);
      newPayments.set(debtId, payments);
      return { payments: newPayments };
    }),
  addDebt: (debt) =>
    set((state) => ({ debts: [...state.debts, debt] })),
  updateDebt: (debt) =>
    set((state) => ({
      debts: state.debts.map((d) => (d.id === debt.id ? debt : d)),
    })),
  deleteDebt: (id) =>
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== id),
    })),
  addContact: (contact) =>
    set((state) => ({ contacts: [...state.contacts, contact] })),
  updateContact: (contact) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === contact.id ? contact : c)),
    })),
  deleteContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),
  addPayment: (debtId, payment) =>
    set((state) => {
      const existing = state.payments.get(debtId) || [];
      const newPayments = new Map(state.payments);
      newPayments.set(debtId, [...existing, payment]);
      return { payments: newPayments };
    }),
}));

interface UIState {
  isLoading: boolean;
  activeTab: 'home' | 'people' | 'history' | 'reports' | 'settings';
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'home' | 'people' | 'history' | 'reports' | 'settings') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  activeTab: 'home',
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));