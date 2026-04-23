'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store';
import { colors, fonts, spacing, borderRadius, buttonStyle, inputStyle, labelStyle, shadow } from '@/lib/design';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { user, token, setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token && user) {
      router.push('/');
    }
  }, [token, user, mounted, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          password_confirmation: data.confirmPassword, // ✅ matches Laravel's confirmed rule
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      setUser(result.user);
      setToken(result.token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      backgroundColor: colors.bg,
      color: colors.light,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      fontFamily: fonts.dmSans,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        boxShadow: shadow.lg,
      }}>
        <div style={{ marginBottom: spacing.xl }}>
          <h1 style={{
            fontFamily: fonts.caveat,
            fontSize: '48px',
            fontWeight: 700,
            color: colors.brand,
            margin: 0,
            marginBottom: spacing.md,
          }}>Personal Finance Tracker</h1>
          <p style={{
            fontSize: '14px',
            color: colors.mutedLight,
            margin: 0,
          }}>Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Juan Dela Cruz"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: colors.dark,
                color: colors.light,
                fontSize: '14px',
              } as React.CSSProperties}
            />
            {errors.name && (
              <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: colors.dark,
                color: colors.light,
                fontSize: '14px',
              } as React.CSSProperties}
            />
            {errors.email && (
              <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: colors.dark,
                color: colors.light,
                fontSize: '14px',
              } as React.CSSProperties}
            />
            {errors.password && (
              <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: colors.dark,
                color: colors.light,
                fontSize: '14px',
              } as React.CSSProperties}
            />
            {errors.confirmPassword && (
              <p style={{ color: colors.danger, fontSize: '12px', marginTop: spacing.xs, margin: 0 }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div style={{
              backgroundColor: `rgba(249, 115, 22, 0.1)`,
              border: `1px solid ${colors.danger}`,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              color: colors.danger,
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...(buttonStyle('primary') as React.CSSProperties),
              width: '100%',
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{
          fontSize: '13px',
          color: colors.mutedLight,
          marginTop: spacing.lg,
          marginBottom: 0,
          textAlign: 'center',
        }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: colors.brand, textDecoration: 'none', fontWeight: 600 }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}