'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import { setCurrentUser } from '@/lib/auth';
import { analyticsApi } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      user: formData.get('user') as string,
      pass: formData.get('pass') as string,
    };

    try {
      const result = await authApi.login(data);

      if (result.success && result.user) {
        analyticsApi.trackEvent('login_success', { email: result.user.email });
        setCurrentUser(result.user);
        router.push('/dashboard');
      } else {
        analyticsApi.trackEvent('login_fail', { user: data.user });
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <div className="card p-4 shadow-sm" style={{ width: '420px' }}>
        <h4 className="mb-3">Login</h4>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">Email or Phone</label>
            <input
              name="user"
              id="liUser"
              required
              className="form-control"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Password</label>
            <input
              name="pass"
              id="liPass"
              type="password"
              required
              className="form-control"
            />
          </div>
          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="mt-3 small text-center">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

