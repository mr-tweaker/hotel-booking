'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import { analyticsApi } from '@/lib/api-client';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      phone: formData.get('phone') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const result = await authApi.signup(data);

      if (result.success) {
        analyticsApi.trackEvent('signup', { email: data.email });
        // Store signup data for pre-filling property form
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('signupData', JSON.stringify(data));
          sessionStorage.setItem('justSignedUp', 'true');
        }
        alert('Signup successful! Redirecting to property listing...');
        router.push('/list-property?from=signup');
      } else {
        analyticsApi.trackEvent('signup_fail', { email: data.email });
        setError(result.error || 'Signup failed');
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
        <h4 className="mb-3">Sign Up</h4>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form id="signupForm" onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">Name</label>
            <input
              name="name"
              type="text"
              required
              className="form-control"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              type="tel"
              required
              className="form-control"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              required
              className="form-control"
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              required
              className="form-control"
            />
          </div>
          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <p className="mt-3 small text-center">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

