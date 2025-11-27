'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import { apiRequest, apiFormRequest } from '@/lib/api-client';
import { Booking, Property } from '@/types';
import ApplicationEditForm from '@/components/ApplicationEditForm';

interface BookingFormData {
  bookingId: string;
  name: string;
  phone: string;
  checkin: string;
  checkout: string;
  roomNumber: string;
  roomType: string;
  paymentStatus: string;
  guests: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [applications, setApplications] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState('hotel-info');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingApplication, setEditingApplication] = useState<Property | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    bookingId: '',
    name: '',
    phone: '',
    checkin: '',
    checkout: '',
    roomNumber: '',
    roomType: '',
    paymentStatus: 'pending',
    guests: [''],
  });
  const [saving, setSaving] = useState(false);
  
  // Gallery states
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  
  // Custom room types state
  const [customRoomTypes, setCustomRoomTypes] = useState<string[]>([]);
  const [showCustomRoomInput, setShowCustomRoomInput] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');
  
  // Document ID states
  const [idDocuments, setIdDocuments] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [documentPreview, setDocumentPreview] = useState<string[]>([]);
  
  // Auto-filled checkout state
  const [autoFilledCheckout, setAutoFilledCheckout] = useState(false);
  // Track if checkout was already set (locked) when editing started
  const [checkoutLocked, setCheckoutLocked] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    loadBookings();
    loadApplications();
  }, [router]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<Booking[]>('/booking');
      if (result.success && result.data) {
        // Ensure all bookings have bookingId
        const bookingsWithId = result.data.map((b) => ({
          ...b,
          bookingId: b.bookingId || b.id || `BK${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        setBookings(bookingsWithId);
        setFilteredBookings(bookingsWithId);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showToast('Cannot load bookings from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const result = await apiRequest<Property[]>('/property/list');
      if (result.success && result.data) {
        setApplications(result.data);
      } else {
        showToast('Cannot load applications from server', 'danger');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      showToast('Cannot load applications from server', 'danger');
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setUpdatingStatus(listingId);
    try {
      const result = await apiRequest<Property>(`/property/${encodeURIComponent(listingId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (result.success) {
        showToast(`Application ${newStatus} successfully`);
        loadApplications();
      } else {
        showToast(result.error || 'Failed to update status', 'danger');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'danger');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openApplicationEdit = (application: Property) => {
    setEditingApplication(application);
    setShowApplicationModal(true);
  };

  const handleApplicationUpdate = async (updateData: Partial<Property>) => {
    if (!editingApplication) return;

    setSaving(true);
    try {
      const result = await apiRequest<Property>(
        `/property/${encodeURIComponent(editingApplication.listingId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (result.success) {
        showToast('Application updated successfully');
        setShowApplicationModal(false);
        setEditingApplication(null);
        loadApplications();
      } else {
        showToast(result.error || 'Failed to update application', 'danger');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      showToast('Failed to update application', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    toast.style.cssText = 'top: 18px; right: 18px; z-index: 2000; min-width: 220px;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookingId?.toLowerCase().includes(query) ||
          b.name?.toLowerCase().includes(query) ||
          b.phone?.toLowerCase().includes(query) ||
          (Array.isArray(b.guests) &&
            b.guests.some((g) => g.toLowerCase().includes(query)))
      );
    }

    if (fromDate) {
      filtered = filtered.filter(
        (b) => b.checkin && new Date(b.checkin) >= new Date(fromDate)
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (b) =>
          b.checkout &&
          new Date(b.checkout) <= new Date(toDate + 'T23:59:59')
      );
    }

    setFilteredBookings(filtered);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setFilteredBookings(bookings);
  };

  const paymentBadge = (status?: string) => {
    if (!status) return '-';
    const s = status.toLowerCase();
    if (s.includes('paid')) {
      return <span className="badge-paid">Paid</span>;
    }
    if (s.includes('partial')) {
      return <span className="badge-partial">Partially Paid</span>;
    }
    return <span className="badge-due">Pending</span>;
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString();
  };

  const toInputDatetime = (date?: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getCurrentDatetimeLocal = () => {
    const now = new Date();
    const off = now.getTimezoneOffset();
    const local = new Date(now.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  };

  const openEdit = (bookingId: string) => {
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) {
      showToast('Booking not found', 'danger');
      return;
    }
    setEditingBooking(booking);
    const guestsList = Array.isArray(booking.guests) && booking.guests.length > 0
      ? booking.guests
      : booking.name ? [booking.name] : [''];
    
    // Check if checkout is blank/empty - if so, auto-fill with current time
    const existingCheckout = toInputDatetime(booking.checkout);
    const hasCheckout = existingCheckout !== '';
    
    // If checkout already exists, it's locked (not editable)
    // If checkout is blank, auto-fill with current time and allow editing
    const checkoutValue = hasCheckout ? existingCheckout : getCurrentDatetimeLocal();
    const wasAutoFilled = !hasCheckout;
    const isLocked = hasCheckout; // Locked if checkout already exists
    
    setFormData({
      bookingId: booking.bookingId || '',
      name: booking.name || '',
      phone: booking.phone || '',
      checkin: toInputDatetime(booking.checkin),
      checkout: checkoutValue,
      roomNumber: booking.roomNumber || '',
      roomType: booking.roomType || '',
      paymentStatus: booking.paymentStatus || 'pending',
      guests: guestsList,
    });
    
    // Set existing documents
    setExistingDocuments(Array.isArray(booking.documents) ? booking.documents : []);
    setIdDocuments([]);
    setDocumentPreview([]);
    
    // Track checkout state
    setAutoFilledCheckout(wasAutoFilled);
    setCheckoutLocked(isLocked); // Lock if checkout already exists
    
    setShowEditModal(true);
  };

  const openAddBooking = () => {
    setEditingBooking(null);
    setFormData({
      bookingId: 'BK' + Date.now(),
      name: '',
      phone: '',
      checkin: '',
      checkout: '', // Leave blank for new bookings
      roomNumber: '',
      roomType: '',
      paymentStatus: 'pending',
      guests: [''],
    });
    setExistingDocuments([]);
    setIdDocuments([]);
    setDocumentPreview([]);
    setAutoFilledCheckout(false); // Not auto-filled for new bookings
    setCheckoutLocked(false); // Not locked for new bookings
    setShowEditModal(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Filter out empty guest names
      const validGuests = formData.guests.filter(g => g.trim() !== '');
      
      if (validGuests.length === 0) {
        showToast('Please add at least one guest', 'danger');
        setSaving(false);
        return;
      }

      // Build payload - always include checkout field (null if empty to clear it)
      const payload: any = {
        bookingId: formData.bookingId,
        name: validGuests[0] || formData.name, // Primary guest is first in array
        phone: formData.phone,
        checkin: formData.checkin,
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        paymentStatus: formData.paymentStatus,
        guests: validGuests,
        numberOfGuests: validGuests.length,
        price: 0, // Default price, can be updated later
        paymentMethod: 'pending', // Default payment method
      };
      
      // Handle checkout field
      // If checkout is locked (was already set in database), preserve the original value
      if (checkoutLocked && editingBooking) {
        // Keep the existing checkout value from the original booking - don't allow modification
        const originalBooking = bookings.find(b => b.bookingId === formData.bookingId);
        if (originalBooking?.checkout) {
          // Use the original checkout value, not the form value
          payload.checkout = originalBooking.checkout;
          console.log('Checkout is locked - preserving original value from database');
        }
      } else {
        // Checkout is not locked - allow setting/clearing
        // This includes: new bookings, or existing bookings where checkout was blank
        const checkoutValue = formData.checkout?.trim() || '';
        if (checkoutValue !== '') {
          payload.checkout = formData.checkout;
          // Once saved, this checkout will be locked in future edits
        } else {
          // Explicitly set to null to clear the checkout field
          payload.checkout = null;
        }
        console.log('Saving booking with checkout:', payload.checkout);
      }

      let result;
      if (editingBooking) {
        // Update existing booking with file upload support
        const formDataObj = new FormData();
        formDataObj.append('booking', JSON.stringify(payload));
        formDataObj.append('existingDocuments', JSON.stringify(existingDocuments));
        
        // Add new ID documents
        idDocuments.forEach((file) => {
          formDataObj.append('idProofs', file);
        });
        
        result = await apiFormRequest<Booking>(`/booking/${encodeURIComponent(formData.bookingId)}`, formDataObj, 'PUT');
      } else {
        // Create new booking
        const formDataObj = new FormData();
        formDataObj.append('booking', JSON.stringify(payload));
        
        // Add ID documents
        idDocuments.forEach((file) => {
          formDataObj.append('idProofs', file);
        });
        
        result = await apiFormRequest<Booking>('/booking', formDataObj);
      }

      if (result.success) {
        showToast(editingBooking ? 'Booking updated' : 'Booking added');
        setShowEditModal(false);
        // Reset file states
        setIdDocuments([]);
        setDocumentPreview([]);
        setAutoFilledCheckout(false);
        setCheckoutLocked(false);
        loadBookings();
      } else {
        showToast('Failed to save booking', 'danger');
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      showToast('Failed to save booking', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 3 files
    if (files.length + idDocuments.length + existingDocuments.length > 3) {
      showToast('Maximum 3 ID documents allowed', 'danger');
      return;
    }
    
    // Check total count including existing
    if (idDocuments.length + files.length + existingDocuments.length > 3) {
      showToast(`You can only add ${3 - idDocuments.length - existingDocuments.length} more file(s)`, 'danger');
      return;
    }
    
    setIdDocuments([...idDocuments, ...files]);
    
    // Create preview URLs for images, store file info for PDFs
    const newPreviews = files.map((file) => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      } else {
        // For PDFs, return a special marker
        return `pdf:${file.name}`;
      }
    });
    setDocumentPreview([...documentPreview, ...newPreviews]);
    
    // Reset file input
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    const newDocuments = idDocuments.filter((_, i) => i !== index);
    const newPreviews = documentPreview.filter((_, i) => i !== index);
    
    // Revoke object URL to free memory (only for blob URLs)
    const previewToRemove = documentPreview[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    
    setIdDocuments(newDocuments);
    setDocumentPreview(newPreviews);
  };

  const removeExistingDocument = (index: number) => {
    const newDocuments = existingDocuments.filter((_, i) => i !== index);
    setExistingDocuments(newDocuments);
  };

  const addGuest = () => {
    setFormData({
      ...formData,
      guests: [...formData.guests, ''],
    });
  };

  const removeGuest = (index: number) => {
    if (formData.guests.length > 1) {
      const newGuests = formData.guests.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        guests: newGuests,
      });
    } else {
      showToast('At least one guest is required', 'danger');
    }
  };

  const updateGuest = (index: number, value: string) => {
    const newGuests = [...formData.guests];
    newGuests[index] = value;
    setFormData({
      ...formData,
      guests: newGuests,
      // Sync primary guest name with first guest
      name: index === 0 ? value : formData.name,
    });
  };

  const handleAddCustomRoomType = () => {
    if (customRoomInput.trim() === '') {
      showToast('Please enter a room type name', 'danger');
      return;
    }
    
    const trimmedInput = customRoomInput.trim();
    
    // Check if it already exists (case-insensitive)
    const allRoomTypes = ['Deluxe', 'Super Deluxe', 'King', ...customRoomTypes];
    if (allRoomTypes.some(rt => rt.toLowerCase() === trimmedInput.toLowerCase())) {
      showToast('This room type already exists', 'danger');
      return;
    }
    
    // Add to custom room types
    setCustomRoomTypes([...customRoomTypes, trimmedInput]);
    
    // Set it as the selected room type
    setFormData({ ...formData, roomType: trimmedInput });
    
    // Clear input and hide it
    setCustomRoomInput('');
    setShowCustomRoomInput(false);
    
    showToast('Custom room type added');
  };

  const confirmDelete = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setShowDeleteModal(true);
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      const result = await apiRequest(`/booking/${encodeURIComponent(bookingToDelete)}`, {
        method: 'DELETE',
      });

      if (result.success) {
        showToast('Booking deleted');
        setShowDeleteModal(false);
        setBookingToDelete(null);
        loadBookings();
      } else {
        showToast('Failed to delete booking', 'danger');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showToast('Failed to delete booking', 'danger');
    }
  };

  const exportToCSV = (data: Booking[], filename: string) => {
    if (!data || !data.length) {
      showToast('No rows to export', 'danger');
      return;
    }

    const keys = ['bookingId', 'name', 'phone', 'roomNumber', 'roomType', 'checkin', 'checkout', 'paymentStatus'];
    const rows = [
      keys.join(','),
      ...data.map((b) =>
        keys
          .map((k) => {
            const value = k === 'name' 
              ? (Array.isArray(b.guests) ? b.guests.join('; ') : (b.name || ''))
              : (b[k as keyof Booking] || '');
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderAvailability = () => {
    const now = new Date();
    const booked = bookings.filter((b) => {
      if (!b.checkin || !b.checkout) return false;
      const ci = new Date(b.checkin);
      const co = new Date(b.checkout);
      return ci <= now && co >= now;
    });

    const bookedCount = booked.length;
    const totalRooms = 30; // Demo: replace with real hotel room count
    const availableCount = Math.max(0, totalRooms - bookedCount);

    return (
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="booking-card p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="small-muted">Total rooms</div>
                <div className="fs-4 fw-bold">{totalRooms}</div>
              </div>
              <div className="text-end">
                <small className="small-muted">Available now</small>
                <div className="fs-4 text-success fw-bold">{availableCount}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="booking-card p-3">
            <div className="small-muted">Currently booked</div>
            <div className="fs-5 fw-bold">{bookedCount} rooms</div>
            <div className="mt-2 small-muted">
              Next free room times shown in Manage Bookings
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="booking-card p-3">
            <div className="small-muted">Today</div>
            <div className="fs-5 fw-bold">{new Date().toLocaleDateString()}</div>
            <div className="mt-2 small-muted">Keep an eye on peak hours</div>
          </div>
        </div>
      </div>
    );
  };

  const handleGalleryUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (galleryFiles.length === 0) {
      showToast('Please select files to upload', 'danger');
      return;
    }

    setUploadingGallery(true);
    try {
      const formData = new FormData();
      galleryFiles.forEach((file) => {
        formData.append('photos', file);
      });

      // TODO: Implement gallery upload API endpoint
      showToast('Gallery upload feature coming soon');
      setGalleryFiles([]);
      setGalleryPreview([]);
    } catch (error) {
      console.error('Error uploading gallery:', error);
      showToast('Failed to upload gallery', 'danger');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(files);
    
    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreview(previews);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-3">
          <Link className="text-decoration-none" href="/">
            <h3 className="m-0">
              Book<span style={{ color: '#ef4444' }}>O</span>Hours
            </h3>
          </Link>
          <small className="small-muted">Hotel Manager Dashboard</small>
        </div>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => router.push('/')}
          >
            Open site
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="wrap">
        <aside className="sidebar">
          <h5>Manager Menu</h5>
          <nav className="nav flex-column">
            <a
              className={`nav-link ${activeTab === 'hotel-info' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('hotel-info');
              }}
            >
              Hotel Info / Facility
            </a>
            <a
              className={`nav-link ${activeTab === 'manage-booking' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('manage-booking');
              }}
            >
              Manage Bookings
            </a>
            <a
              className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('applications');
              }}
            >
              Applications
            </a>
            <a
              className={`nav-link ${activeTab === 'update-gallery' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('update-gallery');
              }}
            >
              Update Gallery
            </a>
            <a
              className={`nav-link ${activeTab === 'booking-records' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('booking-records');
              }}
            >
              Booking Records
            </a>
          </nav>
        </aside>

        <main className="main">
          {activeTab === 'hotel-info' && (
            <section className="panel">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div>
                  <h4 className="mb-1">Hotel Info</h4>
                  <p className="small-muted mb-0">
                    Overview — current availability and next free times
                  </p>
                </div>
                <div>
                  <button className="btn btn-outline-primary" id="editHotelBtn">
                    Edit Hotel Info
                  </button>
                </div>
              </div>
              {renderAvailability()}
            </section>
          )}

          {activeTab === 'manage-booking' && (
            <section className="panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="mb-0">Manage Bookings</h4>
                  <div className="small-muted">
                    Edit, confirm or delete bookings quickly
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={loadBookings}
                  >
                    Refresh
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={openAddBooking}
                  >
                    + Add Booking
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-borderless align-middle">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guests</th>
                      <th>Phone</th>
                      <th>Room</th>
                      <th>Type</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Payment</th>
                      <th>ID Proofs</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.bookingId}>
                        <td>{b.bookingId}</td>
                        <td>
                          {Array.isArray(b.guests) && b.guests.length
                            ? b.guests.join(', ')
                            : b.name || ''}
                        </td>
                        <td>{b.phone || ''}</td>
                        <td>{b.roomNumber || ''}</td>
                        <td>{b.roomType || ''}</td>
                        <td>{formatDate(b.checkin)}</td>
                        <td>{formatDate(b.checkout)}</td>
                        <td>{paymentBadge(b.paymentStatus)}</td>
                        <td>
                          {b.documents?.map((doc, idx) => {
                            // Check if it's an S3 key (starts with 'id-proofs/') or an old URL
                            const isS3Key = doc.startsWith('id-proofs/');
                            const href = isS3Key 
                              ? `/api/documents/${encodeURIComponent(doc)}`
                              : doc;
                            return (
                              <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge-id"
                              >
                                ID
                              </a>
                            );
                          })}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(b.bookingId || '')}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => confirmDelete(b.bookingId || '')}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'update-gallery' && (
            <section className="panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="mb-0">Update Gallery</h4>
                  <div className="small-muted">Upload photos for this hotel</div>
                </div>
              </div>

              <form onSubmit={handleGalleryUpload} className="mb-3">
                <div className="mb-2">
                  <input
                    type="file"
                    name="photos"
                    id="galleryPhotos"
                    multiple
                    accept="image/*"
                    className="form-control"
                    onChange={handleGalleryFileChange}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploadingGallery || galleryFiles.length === 0}
                  >
                    {uploadingGallery ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
              {galleryPreview.length > 0 && (
                <div className="d-flex gap-2 flex-wrap">
                  {galleryPreview.map((preview, idx) => (
                    <img
                      key={idx}
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'applications' && (
            <section className="panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="mb-0">Property Applications</h4>
                  <div className="small-muted">
                    Review and manage property listing applications
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={loadApplications}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No property applications found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Listing ID</th>
                        <th>Property Name</th>
                        <th>Property Type</th>
                        <th>City</th>
                        <th>Owner</th>
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
                            <div className="small">
                              <div>{app.ownerEmail}</div>
                              <div className="text-muted">{app.ownerMobile}</div>
                            </div>
                          </td>
                          <td>
                            <select
                              className={`form-select form-select-sm ${
                                app.status === 'approved'
                                  ? 'border-success'
                                  : app.status === 'rejected'
                                  ? 'border-danger'
                                  : 'border-warning'
                              }`}
                              value={app.status || 'pending'}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'pending' | 'approved' | 'rejected';
                                handleStatusChange(app.listingId, newStatus);
                              }}
                              disabled={updatingStatus === app.listingId}
                              style={{ minWidth: '120px' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Reject</option>
                            </select>
                            {updatingStatus === app.listingId && (
                              <div className="spinner-border spinner-border-sm ms-2" role="status">
                                <span className="visually-hidden">Updating...</span>
                              </div>
                            )}
                          </td>
                          <td>
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  router.push(`/edit-property/${encodeURIComponent(app.listingId)}?admin=1`)
                                }
                                title="Open full admin edit page"
                              >
                                Admin Edit
                              </button>
                              <a
                                href={`/edit-property/${app.listingId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-info"
                                title="Open in new tab for owner to edit"
                              >
                                Owner Edit
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'booking-records' && (
            <section className="panel">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="mb-0">Booking Records</h4>
                  <div className="small-muted">
                    Search, filter, export and review booking history
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={loadBookings}
                  >
                    Refresh
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => exportToCSV(filteredBookings, 'filtered_bookings.csv')}
                  >
                    Export Filtered
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => exportToCSV(bookings, 'all_bookings.csv')}
                  >
                    Export All
                  </button>
                </div>
              </div>

              <div className="filters-row panel mb-3">
                <div className="row g-2 align-items-center">
                  <div className="col-md-5">
                    <input
                      className="form-control"
                      placeholder="Search by Booking ID, guest name or phone"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') applyFilters();
                      }}
                    />
                  </div>
                  <div className="col-auto small-muted">From</div>
                  <div className="col-auto">
                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="col-auto small-muted">To</div>
                  <div className="col-auto">
                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary" onClick={applyFilters}>
                      Apply
                    </button>
                    <button className="btn btn-link" onClick={resetFilters}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guests</th>
                      <th>Phone</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Payment</th>
                      <th>ID Proofs</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.bookingId}>
                        <td>{b.bookingId}</td>
                        <td>
                          {Array.isArray(b.guests) && b.guests.length
                            ? b.guests.join(', ')
                            : b.name || ''}
                        </td>
                        <td>{b.phone || ''}</td>
                        <td>{b.roomNumber || ''}</td>
                        <td>{formatDate(b.checkin)}</td>
                        <td>{formatDate(b.checkout)}</td>
                        <td>{paymentBadge(b.paymentStatus)}</td>
                        <td>
                          {b.documents?.map((doc, idx) => {
                            // Check if it's an S3 key (starts with 'id-proofs/') or an old URL
                            const isS3Key = doc.startsWith('id-proofs/');
                            const href = isS3Key 
                              ? `/api/documents/${encodeURIComponent(doc)}`
                              : doc;
                            return (
                              <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge-id"
                              >
                                ID
                              </a>
                            );
                          })}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEdit(b.bookingId || '')}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Edit/Add Booking Modal */}
      {showEditModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => {
            setShowEditModal(false);
            setAutoFilledCheckout(false);
            setCheckoutLocked(false);
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingBooking ? 'Edit Booking' : 'Add Booking'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
            setShowEditModal(false);
            setAutoFilledCheckout(false);
            setCheckoutLocked(false);
          }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSaveBooking}>
                  <input type="hidden" value={formData.bookingId} />
                  
                  {/* Guests Section */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label mb-0 fw-bold">Guests ({formData.guests.filter(g => g.trim()).length})</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={addGuest}
                      >
                        + Add Guest
                      </button>
                    </div>
                    {formData.guests.map((guest, index) => (
                      <div key={index} className="d-flex gap-2 mb-2">
                        <input
                          className="form-control"
                          placeholder={`Guest ${index + 1} name`}
                          value={guest}
                          onChange={(e) => updateGuest(index, e.target.value)}
                          required={index === 0}
                        />
                        {formData.guests.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeGuest(index)}
                            style={{ minWidth: '40px' }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <small className="text-muted">Add one or more guests for this booking</small>
                  </div>

                  <div className="row g-2">
                    <div className="col-md-12">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col-md-6">
                      <label className="form-label">Check-in</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.checkin}
                        onChange={(e) =>
                          setFormData({ ...formData, checkin: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Check-out <span className="text-muted small">(Optional)</span>
                        {autoFilledCheckout && editingBooking && !checkoutLocked && (
                          <span className="badge bg-success ms-2" style={{ fontSize: '10px' }}>
                            Auto-filled
                          </span>
                        )}
                        {checkoutLocked && editingBooking && (
                          <span className="badge bg-secondary ms-2" style={{ fontSize: '10px' }}>
                            Locked
                          </span>
                        )}
                      </label>
                      <div className="input-group">
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={formData.checkout || ''}
                          onChange={(e) => {
                            if (!checkoutLocked) {
                              setFormData({ ...formData, checkout: e.target.value });
                              // Clear auto-filled flag if user manually changes it
                              if (autoFilledCheckout) {
                                setAutoFilledCheckout(false);
                              }
                            }
                          }}
                          disabled={checkoutLocked}
                          placeholder="Leave blank if checkout time is unknown"
                          style={{
                            backgroundColor: checkoutLocked ? '#f8f9fa' : undefined,
                            cursor: checkoutLocked ? 'not-allowed' : undefined,
                          }}
                        />
                        {formData.checkout && !checkoutLocked && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setFormData({ ...formData, checkout: '' });
                              setAutoFilledCheckout(false);
                            }}
                            title="Clear checkout date"
                          >
                            ×
                          </button>
                        )}
                        {checkoutLocked && (
                          <span className="input-group-text bg-light" title="Checkout time is locked and cannot be changed">
                            🔒
                          </span>
                        )}
                        {editingBooking && !formData.checkout && !checkoutLocked && (
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => {
                              const currentTime = getCurrentDatetimeLocal();
                              setFormData({ ...formData, checkout: currentTime });
                              setAutoFilledCheckout(true);
                            }}
                            title="Set to current time"
                          >
                            Now
                          </button>
                        )}
                      </div>
                      <small className="text-muted">
                        {!editingBooking && 'Can be updated later when customer checks out'}
                        {editingBooking && !formData.checkout && !checkoutLocked && 'Click "Now" to set current time'}
                        {editingBooking && autoFilledCheckout && !checkoutLocked && 'Checkout time was automatically set to current time'}
                        {checkoutLocked && 'Checkout time is locked and cannot be modified'}
                      </small>
                    </div>
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col-md-4">
                      <label className="form-label">Room No</label>
                      <input
                        className="form-control"
                        value={formData.roomNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, roomNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Room Type</label>
                      <select
                        className="form-select"
                        value={formData.roomType}
                        onChange={(e) =>
                          setFormData({ ...formData, roomType: e.target.value })
                        }
                      >
                        <option value="">Select Room Type</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Super Deluxe">Super Deluxe</option>
                        <option value="King">King</option>
                        {customRoomTypes.map((roomType) => (
                          <option key={roomType} value={roomType}>
                            {roomType}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2">
                        {!showCustomRoomInput ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowCustomRoomInput(true)}
                          >
                            + Add Custom Room Type
                          </button>
                        ) : (
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Enter custom room type"
                              value={customRoomInput}
                              onChange={(e) => setCustomRoomInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomRoomType();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={handleAddCustomRoomType}
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setShowCustomRoomInput(false);
                                setCustomRoomInput('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Payment Status</label>
                      <select
                        className="form-select"
                        value={formData.paymentStatus}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentStatus: e.target.value })
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="partially paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  {/* Document ID Upload Section */}
                  <div className="mt-3">
                    <label className="form-label fw-bold">Government Issued ID Documents</label>
                    <small className="text-muted d-block mb-2">
                      Upload government-issued ID proofs (Aadhaar, Passport, Driving License, etc.). Maximum 3 files.
                    </small>
                    
                    {/* Existing Documents */}
                    {existingDocuments.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">Existing Documents:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {existingDocuments.map((doc, index) => {
                            // Check if it's an S3 key (starts with 'id-proofs/') or an old URL
                            const isS3Key = doc.startsWith('id-proofs/');
                            const href = isS3Key 
                              ? `/api/documents/${encodeURIComponent(doc)}`
                              : doc;
                            return (
                            <div key={index} className="d-flex align-items-center gap-2 border rounded p-2">
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                              >
                                <span className="badge bg-primary">Document {index + 1}</span>
                              </a>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeExistingDocument(index)}
                              >
                                ×
                              </button>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* File Input */}
                    <div className="mb-2">
                      <input
                        type="file"
                        id="idDocuments"
                        className="form-control"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleDocumentChange}
                        disabled={idDocuments.length + existingDocuments.length >= 3}
                      />
                      <small className="text-muted">
                        Accepted formats: Images (JPG, PNG) or PDF. Max 3 files total.
                      </small>
                    </div>
                    
                    {/* Preview New Documents */}
                    {documentPreview.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted d-block mb-2">New Documents to Upload:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {documentPreview.map((preview, index) => {
                            const file = idDocuments[index];
                            const isImage = file?.type?.startsWith('image/');
                            const isPDF = file?.type === 'application/pdf' || preview.startsWith('pdf:');
                            
                            return (
                              <div key={index} className="position-relative" style={{ width: '120px' }}>
                                <div 
                                  className="border rounded p-2 d-flex align-items-center justify-content-center bg-light"
                                  style={{ 
                                    width: '120px', 
                                    height: '120px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {isImage && preview.startsWith('blob:') ? (
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                      }}
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100"><span class="text-muted small">Image</span></div>';
                                      }}
                                    />
                                  ) : isPDF ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                      <svg 
                                        width="48" 
                                        height="48" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                        className="text-danger mb-1"
                                      >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                      </svg>
                                      <span className="small text-muted mt-1">PDF</span>
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                      <span className="text-muted small">Document</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ 
                                    top: '-8px', 
                                    right: '-8px',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    lineHeight: '1'
                                  }}
                                  onClick={() => removeDocument(index)}
                                >
                                  ×
                                </button>
                                <small 
                                  className="d-block text-center mt-1 text-truncate" 
                                  style={{ 
                                    fontSize: '10px',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={file?.name || `File ${index + 1}`}
                                >
                                  {file?.name || `File ${index + 1}`}
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 d-flex justify-content-end gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
            setShowEditModal(false);
            setAutoFilledCheckout(false);
            setCheckoutLocked(false);
          }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content p-3">
              <div className="modal-body">
                <h5>Delete booking?</h5>
                <p className="small-muted">This action cannot be undone.</p>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteBooking}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {showApplicationModal && editingApplication && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => {
            setShowApplicationModal(false);
            setEditingApplication(null);
          }}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Property Application</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowApplicationModal(false);
                    setEditingApplication(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <ApplicationEditForm
                  application={editingApplication}
                  onSave={handleApplicationUpdate}
                  onCancel={() => {
                    setShowApplicationModal(false);
                    setEditingApplication(null);
                  }}
                  saving={saving}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :root {
          --primary: #0d6efd;
          --muted: #6c757d;
          --card-bg: #ffffff;
          --panel-bg: #f8fafc;
        }
        body {
          font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial;
          background: linear-gradient(180deg, #eef2ff, #ffffff);
          color: #0f172a;
        }
        .wrap {
          display: flex;
          min-height: 100vh;
          gap: 24px;
          padding: 24px;
        }
        .sidebar {
          width: 260px;
          background: var(--card-bg);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
          height: fit-content;
        }
        .sidebar h5 {
          font-weight: 700;
          margin-bottom: 12px;
        }
        .sidebar .nav-link {
          color: #0f172a;
          border-radius: 8px;
          cursor: pointer;
        }
        .sidebar .nav-link.active {
          background: linear-gradient(90deg, #e6f0ff, #eef8ff);
          font-weight: 600;
        }
        .main {
          flex: 1;
        }
        .panel {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
          margin-bottom: 18px;
        }
        .booking-card {
          border-radius: 10px;
          background: linear-gradient(180deg, #fff, #fbfdff);
          padding: 14px;
          box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .booking-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 26px rgba(2, 6, 23, 0.08);
        }
        .small-muted {
          color: var(--muted);
          font-size: 13px;
        }
        .badge-id {
          background: #eef2ff;
          color: #1e3a8a;
          padding: 6px 8px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          margin-right: 6px;
        }
        .badge-paid {
          color: #065f46;
          font-weight: 700;
        }
        .badge-due {
          color: #9a3412;
          font-weight: 700;
        }
        .badge-partial {
          color: #b45309;
          font-weight: 700;
        }
        table thead th {
          background: #f1f5f9;
          border-bottom: 1px solid #e6eef8;
        }
        table tbody tr td {
          vertical-align: middle;
        }
        .filters-row .form-control,
        .filters-row .form-select {
          min-height: 44px;
        }
        @media (max-width: 900px) {
          .wrap {
            flex-direction: column;
            padding: 12px;
          }
          .sidebar {
            width: 100%;
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
