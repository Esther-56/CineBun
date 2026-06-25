// LoginPage.tsx
"use client";
import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Power } from 'lucide-react';
import AuthLayout from '../../Panel/AuthLayout';
import { useRouter } from "nextjs-toploader/app";
import { useFormik } from 'formik';
import * as yup from 'yup';
import { AuthService } from '@/app/services/auth';
import { store } from '@/app/store';

const loginSchema = yup.object({
  email: yup.string().required('Email or username is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async (values: any, { setSubmitting }: any) => {
      setServerError('');
      try {
        const res = await AuthService.login(values);
        if (res.success) {
          const data = res.data;
          store.username = data.username;
          store._id = data._id;
          store.isBanned = data.isBanned;
          store.avatar = data.avatar;
          store.isVerified = data.isVerified;
          store.theme = data.theme;
          router.replace('/');
        } else {
          setServerError(res.message ?? 'Login failed.');
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setServerError(typeof err === 'string' ? err : 'An error occurred.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldError = (key: 'email' | 'password') =>
    formik.touched[key] && formik.errors[key] ? formik.errors[key] : null;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Bunny Forum account to continue."
      footer={
        <p className="text-sm text-(--text-secondary)">
          New here?{' '}
          <button
            onClick={() => router.replace("/auth/register")}
            className="text-(--accent) hover:underline font-semibold"
          >
            Create an account
          </button>
        </p>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Server error */}
        {serverError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-(--bg-page) border border-(--danger) rounded-lg">
            <AlertCircle size={16} className="text-(--danger) shrink-0" />
            <p className="text-sm font-medium text-(--danger)">{serverError}</p>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-id" className="text-sm font-semibold text-(--text-secondary)">
            Email
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              placeholder="jonah_dev"
              {...formik.getFieldProps('email')}
              className={`w-full bg-(--bg-input) border rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors
                ${fieldError('email') ? 'border-(--danger)' : 'border-(--border-soft) focus:border-(--accent)'}`}
            />
          </div>
          {fieldError('email') && (
            <p className="text-xs font-medium text-(--danger)">{fieldError('email')}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-semibold text-(--text-secondary)">
              Password
            </label>
            <a href="/forgot-password" className="text-xs font-semibold text-(--accent) hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...formik.getFieldProps('password')}
              className={`w-full bg-(--bg-input) border rounded-lg pl-10 pr-10 py-3 text-sm font-medium text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors
                ${fieldError('password') ? 'border-(--danger)' : 'border-(--border-soft) focus:border-(--accent)'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary) transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldError('password') && (
            <p className="text-xs font-medium text-(--danger)">{fieldError('password')}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 text-sm font-medium text-(--text-secondary) cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-(--border-medium) bg-(--bg-input) accent-(--accent)"
          />
          Stay logged in
        </label>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg py-3 transition-colors mt-1"
        >
          <Power size={16} />
          {formik.isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}