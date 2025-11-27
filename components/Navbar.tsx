'use client';

// Navbar component - loosely coupled
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '@/lib/auth';
import { User } from '@/types';

export default function Navbar() {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" href="/">
          <span className="logo-brand">BookingHours.com</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link active" href="/" id="navHourlyStay">
                <span className="nav-icon">📊</span>
                <span>Hourly Stay</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/day-stay" id="navOvernightStay">
                <span className="nav-icon">🏠</span>
                <span>Day Stay</span>
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center">
            <Link
              className="nav-link me-3"
              href="/list-property"
              id="navListProperty"
            >
              <span className="nav-icon">📋</span>
              <span>List Your Property</span>
            </Link>
            {user && (
              <Link
                className="nav-link me-3"
                href="/my-applications"
                id="navMyApplications"
              >
                <span className="nav-icon">📝</span>
                <span>My Applications</span>
              </Link>
            )}
            {user ? (
              <div className="dropdown">
                <a
                  className="d-flex align-items-center text-decoration-none dropdown-toggle"
                  href="#"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#e6f0ff',
                      color: '#0d47a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      marginRight: '8px',
                    }}
                  >
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="me-2">
                    <div style={{ fontWeight: 600 }}>
                      {user.name || user.email || user.phone}
                    </div>
                    <small className="text-muted">View profile</small>
                  </div>
                </a>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="profileDropdown"
                >
                  <li>
                    <Link className="dropdown-item" href="#">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard">
                      Bookings
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/my-applications">
                      My Applications
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a
                      className="dropdown-item text-danger"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            ) : (
              <Link
                className="nav-link"
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#1f2937',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '8px 16px',
                }}
              >
                <span>👤</span>
                <span>Login / Register</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

