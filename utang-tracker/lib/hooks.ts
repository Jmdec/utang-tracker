'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useDataStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useAuth = () => {
  const store = useAuthStore();

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      store.setUser(data.user);
      store.setToken(data.token);
      return data;
    },
  });

  const register = useMutation({
    mutationFn: async (credentials: { name: string; email: string; password: string }) => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      store.setUser(data.user);
      store.setToken(data.token);
      return data;
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      store.logout();
    },
  });

  return { ...store, login, register, logout };
};

export const useDebts = () => {
  const token = useAuthStore((state) => state.token);
  const dataStore = useDataStore();
  const queryClient = useQueryClient();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const query = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/debts`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch debts');
      const data = await response.json();
      dataStore.setDebts(data.data || []);
      return data.data || [];
    },
    enabled: !!token,
  });

  const createDebt = useMutation({
    mutationFn: async (debt: Omit<typeof dataStore.debts[0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch(`${API_URL}/debts`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(debt),
      });

      if (!response.ok) throw new Error('Failed to create debt');
      return response.json();
    },
    onSuccess: (data) => {
      dataStore.addDebt(data.data);
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  const updateDebt = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const response = await fetch(`${API_URL}/debts/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update debt');
      return response.json();
    },
    onSuccess: (data) => {
      dataStore.updateDebt(data.data);
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/debts/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete debt');
      return response.json();
    },
    onSuccess: (data, id) => {
      dataStore.deleteDebt(id);
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  return { ...query, createDebt, updateDebt, deleteDebt, debts: dataStore.debts };
};

export const useContacts = () => {
  const token = useAuthStore((state) => state.token);
  const dataStore = useDataStore();
  const queryClient = useQueryClient();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const query = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/contacts`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      dataStore.setContacts(data.data || []);
      return data.data || [];
    },
    enabled: !!token,
  });

  const createContact = useMutation({
    mutationFn: async (contact: Omit<typeof dataStore.contacts[0], 'id' | 'createdAt'>) => {
      const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(contact),
      });

      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    onSuccess: (data) => {
      dataStore.addContact(data.data);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: (data) => {
      dataStore.updateContact(data.data);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    onSuccess: (data, id) => {
      dataStore.deleteContact(id);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return { ...query, createContact, updateContact, deleteContact, contacts: dataStore.contacts };
};
