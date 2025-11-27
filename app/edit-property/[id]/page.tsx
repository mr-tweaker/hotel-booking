'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import { apiRequest, apiFormRequest } from '@/lib/api-client';
import { Property } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = params.id as string;
  const isAdminMode = searchParams.get('admin') === '1';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [selectedHotelAmenities, setSelectedHotelAmenities] = useState<string[]>([]);
  const [placesOfInterest, setPlacesOfInterest] = useState<Array<{ name: string; distance: string }>>([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDistance, setNewPlaceDistance] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [overnightRooms, setOvernightRooms] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [bookingTypeCategories, setBookingTypeCategories] = useState<string[]>([]);
  
  // Amenities lists
  const hotelAmenitiesList = [
    { name: 'Wifi', icon: '📶' },
    { name: 'Parking', icon: '🅿️' },
    { name: 'Gym', icon: '💪' },
    { name: 'Conference Hall', icon: '🏛️' },
    { name: 'Banquet Hall', icon: '🎉' },
    { name: 'Foreign Exchange', icon: '💱' },
    { name: 'Laundry System', icon: '👔' },
    { name: 'Luggage Room', icon: '🧳' },
    { name: 'Travel Desk', icon: '✈️' },
    { name: 'Pay By Card', icon: '💳' },
    { name: 'Fax', icon: '📠' },
    { name: 'News Paper', icon: '📰' },
    { name: 'Elevator', icon: '🛗' },
    { name: 'Restaurant', icon: '🍽️' },
    { name: 'Car Rental', icon: '🚗' },
    { name: 'Ironing', icon: '♨️' },
  ];
  
  const roomAmenitiesList = [
    { name: 'Mineral Water', icon: '💧' },
    { name: 'Shower', icon: '🚿' },
    { name: 'Wifi', icon: '📶' },
    { name: 'Room Heater', icon: '🔥' },
    { name: 'Hot Water', icon: '♨️' },
    { name: 'Toiletries', icon: '🧴' },
    { name: 'Towel', icon: '🧺' },
    { name: 'Hair Dryer', icon: '💨' },
    { name: 'Tv', icon: '📺' },
    { name: 'Iron', icon: '♨️' },
    { name: 'Safe', icon: '🔒' },
    { name: 'Ac', icon: '❄️' },
    { name: 'Sofa', icon: '🛋️' },
    { name: 'Tea Maker', icon: '☕' },
  ];

  const standardRoomTypes = ['Normal', 'Deluxe', 'Super Deluxe', 'King'];
  const addCustomRoomTypeValue = '__add_custom_room_type__';

  useEffect(() => {
    loadProperty();
  }, [listingId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<Property>(`/property/${encodeURIComponent(listingId)}`);
      
      if (result.success && result.data) {
        // The API route now returns the property directly
        // apiRequest wraps it in { success: true, data: Property }
        const prop = result.data as Property;
        
        if (!prop || !prop.listingId) {
          setError('Invalid property data received');
          return;
        }
        
        setProperty(prop);
        setFormData(prop);
        setSelectedHotelAmenities(prop.hotelAmenities || []);
        setPlacesOfInterest(prop.placesOfInterest || []);

        // Normalize overnight rooms to use the object structure our UI expects:
        // room.roomAmenities: { [category: string]: string[] }
        const normalizedOvernightRooms = (prop.overnightRooms || []).map((room: any) => {
          let roomAmenities = room.roomAmenities;

          // If stored as an array (legacy), convert to object keyed by current category
          if (Array.isArray(roomAmenities)) {
            const key = room.category || 'default';
            roomAmenities = { [key]: roomAmenities };
          }

          // If stored as a string (single amenity), convert to array under current category
          if (typeof roomAmenities === 'string') {
            const key = room.category || 'default';
            roomAmenities = { [key]: [roomAmenities] };
          }

          // If still missing, initialize as empty object
          if (!roomAmenities) {
            roomAmenities = {};
          }

          return {
            ...room,
            roomAmenities,
          };
        });
        setOvernightRooms(normalizedOvernightRooms);
        // Normalize hourly rooms to ensure roomAmenities structure exists
        // Normalize packages to ensure charges structure exists
        console.log('[Edit Property] Loading packages from property:', {
          packagesCount: prop.packages?.length || 0,
          packages: prop.packages,
        });
        
        const normalizedPackages = (prop.packages || []).map((pkg: any) => {
          // If package has checkInCharge/hourlyCharge but no charges object, migrate to charges structure
          if (pkg.category && (pkg.checkInCharge || pkg.hourlyCharge) && !pkg.charges) {
            return {
              ...pkg,
              charges: {
                [pkg.category]: {
                  checkInCharge: pkg.checkInCharge || '',
                  hourlyCharge: pkg.hourlyCharge || ''
                }
              }
            };
          }
          // Ensure charges object exists
          if (!pkg.charges) {
            pkg.charges = {};
          }
          // Load current category's charges into the main fields if category is set
          if (pkg.category && pkg.charges[pkg.category]) {
            pkg.checkInCharge = pkg.charges[pkg.category].checkInCharge || '';
            pkg.hourlyCharge = pkg.charges[pkg.category].hourlyCharge || '';
          } else {
            pkg.checkInCharge = '';
            pkg.hourlyCharge = '';
          }
          return pkg;
        });
        
        console.log('[Edit Property] Normalized packages:', {
          packagesCount: normalizedPackages.length,
          packages: normalizedPackages.map(pkg => ({
            duration: pkg.duration,
            category: pkg.category,
            hourlyCharge: pkg.hourlyCharge,
            checkInCharge: pkg.checkInCharge,
          })),
        });
        
        setPackages(normalizedPackages);
        setBookingTypeCategories((prop as any).bookingTypeCategories || []);
        
        if (prop.latitude && prop.longitude) {
          setLocation({ lat: prop.latitude, lng: prop.longitude });
        }
        
        // Load existing property images if any
        if (prop.propertyImages && prop.propertyImages.length > 0) {
          // These are S3 keys, we'll need to generate signed URLs or display them differently
          // For now, just set the preview to empty and let users re-upload if needed
          setImagePreview([]);
        }
        
        // Authorization: If user has the application ID, they can edit it
        // The application ID is like a secret key - only the owner would have it
        // We'll show a warning if they're logged in with a different email, but still allow editing
        const user = getCurrentUser();
        // No need to block - having the application ID is sufficient authorization
      } else {
        setError(result.error || 'Property not found');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Failed to load property application');
    } finally {
      setLoading(false);
    }
  };

  const handleHotelAmenityChange = (amenityName: string, checked: boolean) => {
    if (checked) {
      setSelectedHotelAmenities([...selectedHotelAmenities, amenityName]);
    } else {
      setSelectedHotelAmenities(selectedHotelAmenities.filter(a => a !== amenityName));
    }
  };

  const addPlaceOfInterest = () => {
    if (newPlaceName.trim()) {
      setPlacesOfInterest([...placesOfInterest, { name: newPlaceName.trim(), distance: newPlaceDistance.trim() }]);
      setNewPlaceName('');
      setNewPlaceDistance('');
    }
  };

  const removePlaceOfInterest = (index: number) => {
    setPlacesOfInterest(placesOfInterest.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = e.currentTarget;
    if (!form) {
      setSaving(false);
      return;
    }

    const formDataObj = new FormData(form);
    
    // Add amenities and places of interest
    selectedHotelAmenities.forEach(amenity => {
      formDataObj.append('hotelAmenities[]', amenity);
    });
    
    placesOfInterest.forEach((place, index) => {
      formDataObj.append(`placesOfInterest[${index}][name]`, place.name);
      if (place.distance) {
        formDataObj.append(`placesOfInterest[${index}][distance]`, place.distance);
      }
    });
    
    // Add location coordinates
    if (location) {
      formDataObj.append('latitude', location.lat.toString());
      formDataObj.append('longitude', location.lng.toString());
    }

    try {
      // Convert FormData to JSON for PUT request
      console.log('[Edit Property] Submitting packages:', {
        packagesCount: packages.length,
        packages: packages.map(pkg => ({
          duration: pkg.duration,
          category: pkg.category,
          hourlyCharge: pkg.hourlyCharge,
          checkInCharge: pkg.checkInCharge,
        })),
      });

      console.log('[Edit Property] Submitting overnightRooms:', overnightRooms.map((room: any, idx: number) => ({
        index: idx,
        category: room.category,
        roomAmenities: room.roomAmenities,
        roomAmenitiesKeys: room.roomAmenities && typeof room.roomAmenities === 'object' && !Array.isArray(room.roomAmenities) 
          ? Object.keys(room.roomAmenities) 
          : 'N/A',
        roomAmenitiesForCategory: room.roomAmenities && typeof room.roomAmenities === 'object' && !Array.isArray(room.roomAmenities) && room.category
          ? room.roomAmenities[room.category]
          : 'N/A',
      })));

      const updateData: Partial<Property> = {
        propertyName: formDataObj.get('propertyName') as string,
        propertyType: formDataObj.get('propertyType') as string,
        city: formDataObj.get('city') as string,
        state: formDataObj.get('state') as string,
        address: formDataObj.get('address') as string,
        locality: formDataObj.get('locality') as string || undefined,
        pincode: formDataObj.get('pincode') as string || undefined,
        landmark: formDataObj.get('landmark') as string || undefined,
        googleBusinessLink: formDataObj.get('googleBusinessLink') as string || undefined,
        ownerEmail: formDataObj.get('ownerEmail') as string,
        ownerMobile: formDataObj.get('ownerMobile') as string,
        receptionEmail: formDataObj.get('receptionEmail') as string,
        receptionMobile: formDataObj.get('receptionMobile') as string,
        receptionLandline: formDataObj.get('receptionLandline') as string || undefined,
        gstNo: formDataObj.get('gstNo') as string || undefined,
        panNo: formDataObj.get('panNo') as string || undefined,
        hotelAmenities: selectedHotelAmenities,
        placesOfInterest: placesOfInterest,
        latitude: location?.lat,
        longitude: location?.lng,
        overnightRooms: overnightRooms,
        packages: packages,
        bookingTypeCategories: bookingTypeCategories,
      };

      const result = await apiRequest<Property>(
        `/property/${encodeURIComponent(listingId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (result.success) {
        alert('Property application updated successfully!');
        router.push('/list-property');
      } else {
        setError(result.error || 'Failed to update application');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container my-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading property application...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Navbar />
        <div className="container my-5 text-center">
          <div className="alert alert-danger">{error || 'Property not found'}</div>
          <Link href={isAdminMode ? '/dashboard' : '/list-property'} className="btn btn-primary">
            {isAdminMode ? 'Back to Dashboard' : 'Back to List Property'}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container my-5">
        {isAdminMode && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
            <div>
              <strong>Admin mode:</strong> You are editing this property as a site administrator.
              All changes will immediately affect how this hotel appears on the frontend.
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        )}
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2>Edit Property Application</h2>
                <p className="text-muted">Update your property listing details</p>
              </div>
              <Link href="/list-property" className="btn btn-outline-secondary">
                ← Back
              </Link>
            </div>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}
            {property && property.ownerEmail && (() => {
              const currentUser = getCurrentUser();
              const emailMismatch = currentUser && currentUser.email && currentUser.email !== property.ownerEmail;
              if (emailMismatch) {
                return (
                  <div className="alert alert-warning">
                    <strong>Note:</strong> You are logged in with a different email ({currentUser?.email}) than the one used in this application ({property.ownerEmail}). 
                    You can still edit this application since you have the application ID, but for better security, please log in with the email address used when submitting the application.
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleSubmit} className="form-section">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    Property Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="propertyName"
                    className="form-control"
                    value={formData.propertyName || ''}
                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    Property Type <span className="text-danger">*</span>
                  </label>
                  <select
                    name="propertyType"
                    className="form-select"
                    value={formData.propertyType || ''}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    required
                  >
                    <option value="">Property Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Condominium">Condominium</option>
                    <option value="Farm Stay">Farm Stay</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Homestay">Homestay</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Houseboat">Houseboat</option>
                    <option value="Lodge">Lodge</option>
                    <option value="Motel">Motel</option>
                    <option value="Resort">Resort</option>
                    <option value="Room">Room</option>
                    <option value="Vacation Rental">Vacation Rental</option>
                    <option value="Villa">Villa</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Locality</label>
                  <input
                    type="text"
                    name="locality"
                    className="form-control"
                    value={formData.locality || ''}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    className="form-control"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">
                    State <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="address"
                    className="form-control"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    className="form-control"
                    value={formData.landmark || ''}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  />
                  <label className="form-label mt-3">Google Business Page Link</label>
                  <input
                    type="url"
                    name="googleBusinessLink"
                    className="form-control"
                    value={formData.googleBusinessLink || ''}
                    onChange={(e) => setFormData({ ...formData, googleBusinessLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Owner Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    className="form-control"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Owner Mobile <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="ownerMobile"
                    className="form-control"
                    value={formData.ownerMobile || ''}
                    onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Reception Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="receptionEmail"
                    className="form-control"
                    value={formData.receptionEmail || ''}
                    onChange={(e) => setFormData({ ...formData, receptionEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Reception Mobile <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="receptionMobile"
                    className="form-control"
                    value={formData.receptionMobile || ''}
                    onChange={(e) => setFormData({ ...formData, receptionMobile: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Reception Landline</label>
                  <input
                    type="tel"
                    name="receptionLandline"
                    className="form-control"
                    value={formData.receptionLandline || ''}
                    onChange={(e) => setFormData({ ...formData, receptionLandline: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">GST No</label>
                  <input
                    type="text"
                    name="gstNo"
                    className="form-control"
                    value={formData.gstNo || ''}
                    onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                  />
                  <label className="form-label mt-2 small">Upload GST Certificate</label>
                  <input
                    type="file"
                    name="gstCertificate"
                    className="form-control"
                    accept=".pdf,.jpeg,.jpg,.png,.webp"
                  />
                  <small className="text-muted d-block mt-1">
                    Max 5MB (PDF, JPEG, PNG, WEBP)
                  </small>
                  {formData.gstCertificate && (
                    <small className="text-info d-block mt-1">
                      Current: {formData.gstCertificate}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">PAN No</label>
                  <input
                    type="text"
                    name="panNo"
                    className="form-control"
                    value={formData.panNo || ''}
                    onChange={(e) => setFormData({ ...formData, panNo: e.target.value })}
                  />
                  <label className="form-label mt-2 small">Upload PAN Card</label>
                  <input
                    type="file"
                    name="panCard"
                    className="form-control"
                    accept=".pdf,.jpeg,.jpg,.png,.webp"
                  />
                  <small className="text-muted d-block mt-1">
                    Max 5MB (PDF, JPEG, PNG, WEBP)
                  </small>
                  {formData.panCard && (
                    <small className="text-info d-block mt-1">
                      Current: {formData.panCard}
                    </small>
                  )}
                </div>
                <div className="col-12">
                  <label className="form-label">Upload Property Images</label>
                  <div
                    className="file-upload-area"
                    onClick={() => document.getElementById('propertyImages')?.click()}
                    style={{
                      border: '2px dashed #0d6efd',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <input
                      type="file"
                      id="propertyImages"
                      name="propertyImages"
                      multiple
                      accept=".jpeg,.jpg,.png,.webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          const previews = files.map(file => URL.createObjectURL(file));
                          setImagePreview([...imagePreview, ...previews]);
                        }
                      }}
                    />
                    <div style={{ fontSize: '2rem', color: '#0d6efd' }}>📷</div>
                    <p className="mt-2 mb-0">Click to upload</p>
                    <small className="text-muted">
                      Up to 20 files, Max 5MB each (JPEG, PNG, WEBP)
                    </small>
                  </div>
                  {imagePreview.length > 0 && (
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {imagePreview.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={src}
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                            }}
                            alt={`Preview ${idx + 1}`}
                          />
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
                              fontSize: '16px',
                            }}
                            onClick={() => {
                              setImagePreview(imagePreview.filter((_, i) => i !== idx));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities Section */}
              <div className="mt-4">
                <h5>Amenities</h5>
                <div className="mb-4">
                  <h6 className="mb-3">Hotel Amenities</h6>
                  <div className="row g-3">
                    {hotelAmenitiesList.map((amenity, idx) => (
                      <div key={idx} className="col-md-3 col-sm-4 col-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`hotel-amenity-${idx}`}
                            checked={selectedHotelAmenities.includes(amenity.name)}
                            onChange={(e) => handleHotelAmenityChange(amenity.name, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`hotel-amenity-${idx}`}>
                            <span style={{ fontSize: '18px', marginRight: '8px' }}>{amenity.icon}</span>
                            {amenity.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Details (Overnight Rooms) */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Room Details</h5>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      setOvernightRooms([
                        ...overnightRooms,
                        {
                          category: '',
                          roomAmenities: {},
                        },
                      ]);
                    }}
                  >
                    + Add Room
                  </button>
                </div>
                {overnightRooms.map((room, idx) => (
                  <div key={idx} className="card mb-3" style={{ position: 'relative', padding: '15px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute"
                      style={{ top: '10px', right: '10px' }}
                      onClick={() => setOvernightRooms(overnightRooms.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Room Type</label>
                        <select
                          className="form-select"
                          value={room.category || ''}
                          onChange={(e) => {
                            const updated = [...overnightRooms];
                            const previousCategory = updated[idx].category || '';
                            let selectedValue = e.target.value;

                            if (selectedValue === addCustomRoomTypeValue) {
                              const customType = window.prompt('Enter new room type');
                              if (customType && customType.trim()) {
                                selectedValue = customType.trim();
                              } else {
                                e.target.value = updated[idx].category || '';
                                return;
                              }
                            }

                            if (!updated[idx].roomAmenities) {
                              updated[idx].roomAmenities = {};
                            }

                            updated[idx].category = selectedValue;
                            setOvernightRooms(updated);
                          }}
                        >
                          <option value="">Select Room Type</option>
                          {standardRoomTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                          {room.category && !standardRoomTypes.includes(room.category) && (
                            <option value={room.category}>{room.category}</option>
                          )}
                          <option value={addCustomRoomTypeValue}>+ Add Room Type</option>
                        </select>
                      </div>
                      {room.category && (
                        <div className="col-12">
                          <label className="form-label">Room Amenities</label>
                          <div className="row g-3">
                            {roomAmenitiesList.map((amenity, amenityIdx) => {
                              const rawRoomAmenities = room.roomAmenities;
                              const cachedAmenities =
                                rawRoomAmenities && typeof rawRoomAmenities === 'object' && !Array.isArray(rawRoomAmenities)
                                  ? rawRoomAmenities[room.category] || []
                                  : [];
                              const isChecked = cachedAmenities.includes(amenity.name);

                              return (
                                <div key={amenityIdx} className="col-md-3 col-sm-4 col-6">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`overnight-room-amenity-${idx}-${amenityIdx}`}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const updated = [...overnightRooms];
                                        const roomCopy: any = { ...updated[idx] };

                                        // Ensure roomAmenities is an object map, not string/array
                                        if (
                                          !roomCopy.roomAmenities ||
                                          typeof roomCopy.roomAmenities !== 'object' ||
                                          Array.isArray(roomCopy.roomAmenities)
                                        ) {
                                          roomCopy.roomAmenities = {};
                                        }

                                        if (!Array.isArray(roomCopy.roomAmenities[room.category])) {
                                          roomCopy.roomAmenities[room.category] = [];
                                        }

                                        const list: string[] = roomCopy.roomAmenities[room.category];

                                        if (e.target.checked) {
                                          if (!list.includes(amenity.name)) {
                                            roomCopy.roomAmenities[room.category] = [...list, amenity.name];
                                          }
                                        } else {
                                          roomCopy.roomAmenities[room.category] = list.filter(
                                            (a: string) => a !== amenity.name
                                          );
                                        }

                                        updated[idx] = roomCopy;
                                        setOvernightRooms(updated);
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor={`overnight-room-amenity-${idx}-${amenityIdx}`}>
                                      <span style={{ fontSize: '18px', marginRight: '8px' }}>{amenity.icon}</span>
                                      {amenity.name}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking Type */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Booking Type</h5>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mb-3"
                    onClick={() => {
                      setPackages([...packages, {
                        duration: '',
                        category: '',
                        hourlyCharge: '',
                        checkInCharge: '',
                        charges: {}, // Store charges per category: { Normal: { checkInCharge: '', hourlyCharge: '' }, ... }
                        roomDecorate: false,
                        welcomeDrink: false,
                        candleDinner: false,
                        breakfast: false,
                        buffet: false,
                        alacarte: false,
                        spa: false,
                      }]);
                    }}
                  >
                    + Add Booking Type
                  </button>
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-body">
                    <h6 className="mb-3">Available For</h6>
                    <div className="row g-3">
                      <div className="col-md-3 col-sm-6 col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="editBookingTypeHourly"
                            checked={bookingTypeCategories.includes('Hourly')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBookingTypeCategories([...bookingTypeCategories, 'Hourly']);
                              } else {
                                setBookingTypeCategories(bookingTypeCategories.filter(c => c !== 'Hourly'));
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor="editBookingTypeHourly">
                            Hourly
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6 col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="editBookingTypeDay"
                            checked={bookingTypeCategories.includes('Day')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBookingTypeCategories([...bookingTypeCategories, 'Day']);
                              } else {
                                setBookingTypeCategories(bookingTypeCategories.filter(c => c !== 'Day'));
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor="editBookingTypeDay">
                            Day
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {packages.map((pkg, idx) => (
                  <div key={idx} className="card mb-3" style={{ position: 'relative', padding: '15px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute"
                      style={{ top: '10px', right: '10px' }}
                      onClick={() => setPackages(packages.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Booking Duration</label>
                        <select
                          className="form-select"
                          value={pkg.duration || ''}
                          onChange={(e) => {
                            const updated = [...packages];
                            updated[idx].duration = e.target.value;
                            setPackages(updated);
                          }}
                        >
                          <option value="">Select Duration</option>
                          <option value="Hourly">Hourly</option>
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="24 hours">24 hours</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Room Category</label>
                        <select
                          className="form-select"
                          value={pkg.category || ''}
                          onChange={(e) => {
                            const updated = [...packages];
                            const previousCategory = updated[idx].category || '';
                            const newCategory = e.target.value;
                            
                            // Initialize charges object if it doesn't exist
                            if (!updated[idx].charges) {
                              updated[idx].charges = {};
                            }
                            
                            // Save current charge values to the previous category before switching
                            if (previousCategory && (updated[idx].checkInCharge || updated[idx].hourlyCharge)) {
                              updated[idx].charges[previousCategory] = {
                                checkInCharge: updated[idx].checkInCharge || '',
                                hourlyCharge: updated[idx].hourlyCharge || ''
                              };
                            }
                            
                            // Update category
                            updated[idx].category = newCategory;
                            
                            // Load cached values for the new category, or set empty if not cached
                            if (newCategory && updated[idx].charges[newCategory]) {
                              updated[idx].checkInCharge = updated[idx].charges[newCategory].checkInCharge || '';
                              updated[idx].hourlyCharge = updated[idx].charges[newCategory].hourlyCharge || '';
                            } else {
                              updated[idx].checkInCharge = '';
                              updated[idx].hourlyCharge = '';
                            }
                            
                            setPackages(updated);
                          }}
                        >
                          <option value="">Select Room Category</option>
                          <option value="Normal">Normal</option>
                          <option value="Deluxe">Deluxe</option>
                          <option value="Super Deluxe">Super Deluxe</option>
                          <option value="King">King</option>
                        </select>
                      </div>
                      {pkg.category &&
                        (pkg.duration === 'Hourly' ? (
                          <>
                            <div className="col-md-6">
                              <label className="form-label">Hourly Charge</label>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Hourly Charge"
                                value={pkg.hourlyCharge || ''}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].hourlyCharge = e.target.value;
                                  if (updated[idx].category && !updated[idx].charges) {
                                    updated[idx].charges = {};
                                  }
                                  if (updated[idx].category) {
                                    if (!updated[idx].charges[updated[idx].category]) {
                                      updated[idx].charges[updated[idx].category] = { checkInCharge: '', hourlyCharge: '' };
                                    }
                                    updated[idx].charges[updated[idx].category].hourlyCharge = e.target.value;
                                  }
                                  setPackages(updated);
                                }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Check-in Charge</label>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Check-in Charge"
                                value={pkg.checkInCharge || ''}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].checkInCharge = e.target.value;
                                  if (updated[idx].category && !updated[idx].charges) {
                                    updated[idx].charges = {};
                                  }
                                  if (updated[idx].category) {
                                    if (!updated[idx].charges[updated[idx].category]) {
                                      updated[idx].charges[updated[idx].category] = { checkInCharge: '', hourlyCharge: '' };
                                    }
                                    updated[idx].charges[updated[idx].category].checkInCharge = e.target.value;
                                  }
                                  setPackages(updated);
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="col-md-6">
                            {(() => {
                              const label =
                                pkg.duration === 'Day'
                                  ? 'Day Charge'
                                  : pkg.duration === 'Night'
                                  ? 'Night Charge'
                                  : pkg.duration === '24 hours'
                                  ? '24-Hour Charge'
                                  : 'Check-in Charge';
                              return (
                                <>
                                  <label className="form-label">{label}</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder={label}
                                    value={pkg.checkInCharge || ''}
                                    onChange={(e) => {
                                      const updated = [...packages];
                                      updated[idx].checkInCharge = e.target.value;
                                      if (updated[idx].category && !updated[idx].charges) {
                                        updated[idx].charges = {};
                                      }
                                      if (updated[idx].category) {
                                        if (!updated[idx].charges[updated[idx].category]) {
                                          updated[idx].charges[updated[idx].category] = { checkInCharge: '', hourlyCharge: '' };
                                        }
                                        updated[idx].charges[updated[idx].category].checkInCharge = e.target.value;
                                      }
                                      setPackages(updated);
                                    }}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      <div className="col-12">
                        <div className="row g-2">
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.roomDecorate || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].roomDecorate = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Room Decorate</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.welcomeDrink || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].welcomeDrink = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Welcome Drink</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.candleDinner || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].candleDinner = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Candle Dinner</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.breakfast || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].breakfast = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Breakfast</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.buffet || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].buffet = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Buffet</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.alacarte || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].alacarte = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">A La Carte</label>
                            </div>
                          </div>
                          <div className="col-md-3 col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pkg.spa || false}
                                onChange={(e) => {
                                  const updated = [...packages];
                                  updated[idx].spa = e.target.checked;
                                  setPackages(updated);
                                }}
                              />
                              <label className="form-check-label">Spa</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Places of Interest */}
              <div className="mt-4">
                <h5>Places of Interest</h5>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Place Name"
                      value={newPlaceName}
                      onChange={(e) => setNewPlaceName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Distance (e.g., 0.4 km)"
                      value={newPlaceDistance}
                      onChange={(e) => setNewPlaceDistance(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={addPlaceOfInterest}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {placesOfInterest.length > 0 && (
                  <div className="list-group">
                    {placesOfInterest.map((place, idx) => (
                      <div key={idx} className="list-group-item d-flex justify-content-between">
                        <div>
                          <strong>{place.name}</strong>
                          {place.distance && <span className="text-muted ms-2">({place.distance})</span>}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removePlaceOfInterest(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Maps Location */}
              <div className="mt-4">
                <h5>Property Location on Map</h5>
                <GoogleMapPicker
                  onLocationSelect={(lat, lng) => {
                    setLocation({ lat, lng });
                  }}
                  initialLat={property.latitude}
                  initialLng={property.longitude}
                  height="400px"
                />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Link href="/list-property" className="btn btn-outline-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

