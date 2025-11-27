'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest } from '@/lib/api-client';
import { Property } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedApplication, setSearchedApplication] = useState<Property | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser && currentUser.email) {
      loadMyApplications(currentUser);
    } else {
      setLoading(false);
    }
  }, []);

  const loadMyApplications = async (currentUser?: ReturnType<typeof getCurrentUser>) => {
    const userToUse = currentUser || user;
    if (!userToUse || !userToUse.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest<Property[]>('/property/list');
      
      if (result.success && result.data) {
        // Filter applications by owner email
        const myApps = result.data.filter(
          (app) => app.ownerEmail === userToUse.email
        );
        setApplications(myApps);
      } else {
        setError(result.error || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchById = async () => {
    if (!searchId.trim()) {
      setSearchError('Please enter an application ID');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchedApplication(null);

    try {
      const result = await apiRequest<Property>(
        `/property/${encodeURIComponent(searchId.trim())}`
      );

      if (result.success && result.data) {
        setSearchedApplication(result.data);
      } else {
        setSearchError(result.error || 'Application not found');
      }
    } catch (error) {
      console.error('Error searching application:', error);
      setSearchError('Failed to search application');
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-warning';
    }
  };

  const getStatusText = (status?: string) => {
    return status || 'pending';
  };

  return (
    <>
      <Navbar />
      <div className="container my-5">
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2>My Property Applications</h2>
                <p className="text-muted">View and manage your property listing applications</p>
              </div>
              <Link href="/list-property" className="btn btn-primary">
                + Submit New Application
              </Link>
            </div>

            {/* Search by Application ID Section */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Search by Application ID</h5>
                <p className="text-muted small">
                  If you have your application ID (e.g., PROP1763901844633cd6qi7hvc), enter it below to view and edit your application.
                </p>
                <div className="row g-2">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Application ID (e.g., PROP1763901844633cd6qi7hvc)"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchById();
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleSearchById}
                      disabled={searching}
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
                {searchError && (
                  <div className="alert alert-danger mt-2 mb-0">{searchError}</div>
                )}
                {searchedApplication && (
                  <div className="mt-3">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="card-title">{searchedApplication.propertyName}</h6>
                            <p className="card-text small mb-1">
                              <strong>Application ID:</strong>{' '}
                              <code>{searchedApplication.listingId}</code>
                            </p>
                            <p className="card-text small mb-1">
                              <strong>Status:</strong>{' '}
                              <span className={`badge ${getStatusBadgeClass(searchedApplication.status)}`}>
                                {getStatusText(searchedApplication.status)}
                              </span>
                            </p>
                            <p className="card-text small mb-0">
                              <strong>Submitted:</strong>{' '}
                              {searchedApplication.submittedAt
                                ? new Date(searchedApplication.submittedAt).toLocaleDateString()
                                : '-'}
                            </p>
                          </div>
                          <Link
                            href={`/edit-property/${searchedApplication.listingId}`}
                            className="btn btn-sm btn-primary"
                          >
                            Edit Application
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* My Applications List */}
            {user && user.email ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>My Submitted Applications</h5>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => loadMyApplications()}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">{error}</div>
                ) : applications.length === 0 ? (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <p className="text-muted mb-3">You haven't submitted any applications yet.</p>
                      <Link href="/list-property" className="btn btn-primary">
                        Submit Your First Application
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Application ID</th>
                          <th>Property Name</th>
                          <th>Property Type</th>
                          <th>City</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.listingId || app._id}>
                            <td>
                              <code className="small">{app.listingId}</code>
                            </td>
                            <td>
                              <strong>{app.propertyName}</strong>
                              {app.locality && (
                                <div className="small text-muted">{app.locality}</div>
                              )}
                            </td>
                            <td>{app.propertyType}</td>
                            <td>{app.city}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </td>
                            <td>
                              {app.submittedAt
                                ? new Date(app.submittedAt).toLocaleDateString()
                                : '-'}
                            </td>
                            <td>
                              <Link
                                href={`/edit-property/${app.listingId}`}
                                className="btn btn-sm btn-primary"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : mounted && (!user || !user.email) ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <p className="text-muted mb-3">
                    Please log in to view your applications, or use the search above to find your application by ID.
                  </p>
                  <Link href="/login" className="btn btn-primary">
                    Log In
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

