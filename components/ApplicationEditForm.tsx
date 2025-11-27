'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types';

interface ApplicationEditFormProps {
  application: Property;
  onSave: (data: Partial<Property>) => void;
  onCancel: () => void;
  saving: boolean;
}

export default function ApplicationEditForm({
  application,
  onSave,
  onCancel,
  saving,
}: ApplicationEditFormProps) {
  const [formData, setFormData] = useState<Partial<Property>>(application);

  useEffect(() => {
    setFormData(application);
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Property Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.propertyName || ''}
            onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Property Type</label>
          <select
            className="form-select"
            value={formData.propertyType || ''}
            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            required
          >
            <option value="Hotel">Hotel</option>
            <option value="Resort">Resort</option>
            <option value="Homestay">Homestay</option>
            <option value="Apartment">Apartment</option>
            <option value="Guest House">Guest House</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">City</label>
          <input
            type="text"
            className="form-control"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Locality</label>
          <input
            type="text"
            className="form-control"
            value={formData.locality || ''}
            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State</label>
          <input
            type="text"
            className="form-control"
            value={formData.state || ''}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Address</label>
          <textarea
            className="form-control"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            rows={2}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Owner Email</label>
          <input
            type="email"
            className="form-control"
            value={formData.ownerEmail || ''}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Owner Mobile</label>
          <input
            type="tel"
            className="form-control"
            value={formData.ownerMobile || ''}
            onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Reception Email</label>
          <input
            type="email"
            className="form-control"
            value={formData.receptionEmail || ''}
            onChange={(e) => setFormData({ ...formData, receptionEmail: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Reception Mobile</label>
          <input
            type="tel"
            className="form-control"
            value={formData.receptionMobile || ''}
            onChange={(e) => setFormData({ ...formData, receptionMobile: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={formData.status || 'pending'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Pincode</label>
          <input
            type="text"
            className="form-control"
            value={formData.pincode || ''}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
        </div>
        {formData.hotelAmenities && formData.hotelAmenities.length > 0 && (
          <div className="col-12">
            <label className="form-label">Hotel Amenities</label>
            <div className="small text-muted">
              {formData.hotelAmenities.join(', ')}
            </div>
          </div>
        )}
        {formData.roomAmenities && formData.roomAmenities.length > 0 && (
          <div className="col-12">
            <label className="form-label">Room Amenities</label>
            <div className="small text-muted">
              {formData.roomAmenities.join(', ')}
            </div>
          </div>
        )}
        {formData.placesOfInterest && formData.placesOfInterest.length > 0 && (
          <div className="col-12">
            <label className="form-label">Places of Interest</label>
            <div className="small text-muted">
              {formData.placesOfInterest.map((p, i) => (
                <div key={i}>
                  {p.name} {p.distance && `(${p.distance})`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}








