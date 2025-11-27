// Home page - main search and listing page (Hourly Stay)
'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelCard from '@/components/HotelCard';
import { Hotel, SearchFilters } from '@/types';
import { analyticsApi, hotelsApi } from '@/lib/api-client';

type PropertyType = 'hotels' | 'homestays' | 'resorts';

interface SearchFormData {
  city: string;
  locality: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  rooms: number;
  adults: number;
  children: number;
}

export default function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
    sortOrder: 'desc',
  });
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('hotels');
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  
  // Search form state
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    city: 'Delhi',
    locality: 'All',
    checkInDate: '2025-12-20',
    checkOutDate: '2025-12-21',
    checkInTime: '08:00',
    checkOutTime: '20:00',
    rooms: 1,
    adults: 2,
    children: 0,
  });

  // Dynamic data
  const [cities, setCities] = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showLocalityDropdown, setShowLocalityDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  useEffect(() => {
    analyticsApi.trackEvent('visit_home');
    loadInitialData();
  }, []);

  useEffect(() => {
    // Update search city based on property type
    if (selectedPropertyType === 'homestays') {
      setSearchForm((prev) => ({ ...prev, city: 'Coorg', locality: 'All' }));
    } else if (selectedPropertyType === 'resorts') {
      setSearchForm((prev) => ({ ...prev, city: 'Manali', locality: 'All' }));
    } else {
      setSearchForm((prev) => ({ ...prev, city: 'Delhi', locality: 'All' }));
    }
  }, [selectedPropertyType]);

  useEffect(() => {
    // Load localities when city changes
    if (searchForm.city) {
      loadLocalities(searchForm.city);
      // Clear selected localities when city changes
      setSelectedLocalities([]);
    }
  }, [searchForm.city]);

  // Trigger search when city changes (separate effect to avoid dependency issues)
  useEffect(() => {
    if (searchForm.city) {
      const timer = setTimeout(() => {
        performSearch();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchForm.city]);

  const loadInitialData = async () => {
    try {
      // Load cities
      const citiesResult = await hotelsApi.getCities();
      if (citiesResult.success && citiesResult.data) {
        setCities(citiesResult.data);
      }

      // Load initial hotels for default search
      await performSearch();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadLocalities = async (city: string) => {
    try {
      const result = await hotelsApi.getLocalities(city);
      if (result.success && result.data) {
        setLocalities(result.data);
      }
    } catch (error) {
      console.error('Error loading localities:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const propertyTypeMap: Record<PropertyType, string> = {
        hotels: 'Hotel',
        homestays: 'Homestay',
        resorts: 'Resort',
      };

      // Use selectedLocalities if available, otherwise fall back to searchForm.locality
      const localityFilter = selectedLocalities.length > 0 
        ? selectedLocalities 
        : searchForm.locality !== 'All' 
        ? [searchForm.locality] 
        : undefined;

      // Use selectedStars if available, otherwise fall back to filters.stars
      const starsFilter = selectedStars.length > 0 
        ? selectedStars 
        : typeof filters.stars === 'string' && filters.stars !== 'any'
        ? [Number(filters.stars)]
        : typeof filters.stars === 'number'
        ? [filters.stars]
        : undefined;

      const searchParams = {
        city: searchForm.city,
        locality: localityFilter,
        propertyType: propertyTypeMap[selectedPropertyType],
        maxPrice: filters.maxPrice,
        minPrice: filters.minPrice,
        stars: starsFilter,
        amenities: filters.amenities,
        checkIn: searchForm.checkInDate
          ? new Date(`${searchForm.checkInDate}T${searchForm.checkInTime}`).toISOString()
          : undefined,
        checkOut: searchForm.checkOutDate
          ? new Date(`${searchForm.checkOutDate}T${searchForm.checkOutTime}`).toISOString()
          : undefined,
        guests: searchForm.adults + searchForm.children,
        rooms: searchForm.rooms,
        sortBy: filters.sortBy || 'popularity',
        sortOrder: filters.sortOrder || 'desc',
        coupleFriendly: filters.coupleFriendly,
        localId: filters.localId,
        payAtHotel: filters.payAtHotel,
        newlyAdded: filters.newlyAdded,
      };

      const result = await hotelsApi.search(searchParams);

      if (result.success && result.data) {
        // Transform backend data to frontend Hotel format
        const transformedHotels: Hotel[] = result.data.map((h: any) => ({
          id: h.hotelId || h._id || String(Date.now()),
          name: h.name,
          locality: h.locality,
          city: h.city,
          price: h.price,
          checkInCharge: h.checkInCharge || 500,
          originalPrice: h.originalPrice || Math.round(h.price * 1.3),
          discount: h.discount,
          bag2bagDiscount: h.bag2bagDiscount,
          stars: h.stars,
          rating: h.rating || h.stars + (Math.random() * 0.5 - 0.2), // Random rating between stars-0.2 and stars+0.3
          reviews: h.reviews || Math.floor(Math.random() * 500) + 5,
          amenities: h.amenities || [],
          images: h.images || [
            `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(h.name)}`,
            `https://source.unsplash.com/400x300/?hotel,room,${encodeURIComponent(h.locality)}`,
            `https://source.unsplash.com/400x300/?hotel,lobby,${encodeURIComponent(h.locality)}`,
            `https://source.unsplash.com/400x300/?hotel,bedroom,${encodeURIComponent(h.locality)}`,
            `https://source.unsplash.com/400x300/?hotel,interior,${encodeURIComponent(h.locality)}`,
          ],
          description: h.description,
          distance: h.distance,
          availability: h.availability,
          isPremium: h.isPremium || h.stars >= 4,
          isCertified: h.isCertified || Math.random() > 0.7,
          availableForHourly: h.availableForHourly,
          availableForDay: h.availableForDay,
          hourlyRooms: h.hourlyRooms,
        }));
        setHotels(transformedHotels);
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    performSearch();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateWithDay = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Navbar />

      {/* Property Type Navigation Section */}
      <section className="property-types-nav py-3 bg-white border-bottom">
        <div className="container">
          <div className="row g-3 justify-content-center">
            <div className="col-6 col-md-4 col-lg-3 col-xl-2">
              <div
                className={`property-type-card ${selectedPropertyType === 'hotels' ? 'active' : ''}`}
                onClick={() => setSelectedPropertyType('hotels')}
              >
                <div className="property-type-image">
                  <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop"
                    alt="Hotels"
                    className="img-fluid"
                  />
                </div>
                <div className="property-type-label">Hotels</div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3 col-xl-2">
              <div
                className={`property-type-card ${selectedPropertyType === 'homestays' ? 'active' : ''}`}
                onClick={() => setSelectedPropertyType('homestays')}
              >
                <div className="property-type-image">
                  <img
                    src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=300&h=200&fit=crop"
                    alt="Homestays"
                    className="img-fluid"
                  />
                </div>
                <div className="property-type-label">Homestays</div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3 col-xl-2">
              <div
                className={`property-type-card ${selectedPropertyType === 'resorts' ? 'active' : ''}`}
                onClick={() => setSelectedPropertyType('resorts')}
              >
                <div className="property-type-image">
                  <img
                    src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=200&fit=crop"
                    alt="Resorts"
                    className="img-fluid"
                  />
                </div>
                <div className="property-type-label">Resorts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Form Section */}
      <section className="search-hero-section py-5" style={{ background: '#0d47a1' }}>
        <div className="container">
          <div className="text-center mb-4">
            {selectedPropertyType === 'homestays' ? (
              <p className="text-white mb-0" style={{ fontSize: '18px', fontWeight: 400 }}>
                Live among locals to experience the true Culture and real Nature of India.
              </p>
            ) : selectedPropertyType === 'resorts' ? (
              <p className="text-white mb-0" style={{ fontSize: '18px', fontWeight: 400 }}>
                Indulge in a luxury living with unmatched amenities that delights you.
              </p>
            ) : (
              <p className="text-white mb-0" style={{ fontSize: '18px', fontWeight: 400 }}>
                Book for multiple Days, Weeks or Months in Hotels, Homes, Apartments and more.
              </p>
            )}
          </div>

          <div className="search-form-container">
            <form className="search-form-card" onSubmit={handleSearchSubmit}>
              <div className="row g-0 align-items-end">
                {/* City, Locality Or Property */}
                <div className="col-md-4">
                  <div className="search-field">
                    <label className="search-label">City, Locality Or Property</label>
                    <div
                      className="search-input-wrapper"
                      onClick={() => setShowCityDropdown(!showCityDropdown)}
                      style={{ position: 'relative' }}
                    >
                      <div className="search-input-content">
                        <div className="search-main-value">
                          <strong>{searchForm.city}</strong>
                        </div>
                        <div className="search-sub-value">India</div>
                      </div>
                      <button
                        type="button"
                        className="btn-near-me"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement geolocation
                          alert('Near me feature coming soon!');
                        }}
                      >
                        {selectedPropertyType === 'resorts' ? (
                          <span style={{ marginRight: '4px' }}>✔</span>
                        ) : (
                          <span style={{ marginRight: '4px' }}>✈</span>
                        )}
                        Near me
                      </button>
                      <span className="dropdown-arrow">▼</span>
                      {showCityDropdown && (
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            maxHeight: '300px',
                            overflowY: 'auto',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setSearchForm((prev) => ({ ...prev, city, locality: 'All' }));
                                setSelectedLocalities([]); // Clear selected localities
                                setShowCityDropdown(false);
                                // Search will be triggered by useEffect when city changes
                              }}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Locality dropdown */}
                    {localities.length > 0 && (
                      <div style={{ marginTop: '8px', position: 'relative' }}>
                        <select
                          className="form-select form-select-sm"
                          value={searchForm.locality}
                          onChange={(e) =>
                            setSearchForm((prev) => ({ ...prev, locality: e.target.value }))
                          }
                        >
                          <option value="All">All {searchForm.city}</option>
                          {localities.map((locality) => (
                            <option key={locality} value={locality}>
                              {locality}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Check-In Check-Out Date */}
                <div className="col-md-3">
                  <div className="search-field">
                    <label className="search-label">Check-In Check-Out Date</label>
                    <div
                      className="search-input-wrapper"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      style={{ position: 'relative' }}
                    >
                      <div className="search-input-content date-range-content">
                        <div className="date-item">
                          <div className="search-main-value">
                            {formatDate(searchForm.checkInDate)}
                          </div>
                          <div className="search-sub-value">
                            {formatDateWithDay(searchForm.checkInDate)}
                          </div>
                        </div>
                        <span className="date-separator">-</span>
                        <div className="date-item">
                          <div className="search-main-value">
                            {formatDate(searchForm.checkOutDate)}
                          </div>
                          <div className="search-sub-value">
                            {formatDateWithDay(searchForm.checkOutDate)}
                          </div>
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                      {showDatePicker && (
                        <div
                          className="card p-3"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            marginTop: '4px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">Check-In</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={searchForm.checkInDate}
                                onChange={(e) =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    checkInDate: e.target.value,
                                  }))
                                }
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Check-Out</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={searchForm.checkOutDate}
                                onChange={(e) =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    checkOutDate: e.target.value,
                                  }))
                                }
                                min={searchForm.checkInDate}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Check-In Time */}
                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Check-In Time</label>
                    <div
                      className="search-input-wrapper"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      style={{ position: 'relative' }}
                    >
                      <div className="search-input-content">
                        <div className="search-main-value">
                          {formatTime(searchForm.checkInTime)}
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                      {showTimePicker && (
                        <div
                          className="card p-2"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            marginTop: '4px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={searchForm.checkInTime}
                            onChange={(e) =>
                              setSearchForm((prev) => ({
                                ...prev,
                                checkInTime: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Check-Out Time */}
                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Check-Out Time</label>
                    <div
                      className="search-input-wrapper"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      style={{ position: 'relative' }}
                    >
                      <div className="search-input-content">
                        <div className="search-main-value">
                          {formatTime(searchForm.checkOutTime)}
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                {/* Guest */}
                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Guest</label>
                    <div
                      className="search-input-wrapper"
                      onClick={() => setShowGuestPicker(!showGuestPicker)}
                      style={{ position: 'relative' }}
                    >
                      <div className="search-input-content">
                        <div className="search-main-value">
                          <strong>{searchForm.rooms} Room</strong>{' '}
                          <strong>{searchForm.adults} Adult</strong>
                          {searchForm.children > 0 && (
                            <>
                              {' '}
                              <strong>{searchForm.children} Child</strong>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                      {showGuestPicker && (
                        <div
                          className="card p-3"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            marginTop: '4px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-2">
                            <label className="form-label small">Rooms</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    rooms: Math.max(1, prev.rooms - 1),
                                  }))
                                }
                              >
                                -
                              </button>
                              <span>{searchForm.rooms}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    rooms: prev.rooms + 1,
                                  }))
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="form-label small">Adults</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    adults: Math.max(1, prev.adults - 1),
                                  }))
                                }
                              >
                                -
                              </button>
                              <span>{searchForm.adults}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    adults: prev.adults + 1,
                                  }))
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="form-label small">Children</label>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    children: Math.max(0, prev.children - 1),
                                  }))
                                }
                              >
                                -
                              </button>
                              <span>{searchForm.children}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  setSearchForm((prev) => ({
                                    ...prev,
                                    children: prev.children + 1,
                                  }))
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="col-md-1">
                  <button type="submit" className="btn-search" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-12">
                  <div className="trip-type-checkboxes">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="businessTrip"
                        name="tripType"
                        value="business"
                      />
                      <label className="form-check-label text-white" htmlFor="businessTrip">
                        Business Trip
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="leisureTrip"
                        name="tripType"
                        value="leisure"
                      />
                      <label className="form-check-label text-white" htmlFor="leisureTrip">
                        Leisure Trip
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <main className="container my-5">
        <div className="row">
          <aside className="col-lg-3 mb-4">
            <div className="card sidebar p-3">
              {/* Sort Section */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Sort</h6>
                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      filters.sortBy === 'popularity'
                        ? 'btn-success'
                        : 'btn-outline-secondary'
                    } text-start`}
                    onClick={() => {
                      handleFilterChange('sortBy', 'popularity');
                      handleFilterChange('sortOrder', 'desc');
                      performSearch();
                    }}
                  >
                    Popularity {filters.sortBy === 'popularity' && '▼'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      filters.sortBy === 'price'
                        ? 'btn-success'
                        : 'btn-outline-secondary'
                    } text-start`}
                    onClick={() => {
                      const newOrder = filters.sortBy === 'price' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      handleFilterChange('sortBy', 'price');
                      handleFilterChange('sortOrder', newOrder);
                      performSearch();
                    }}
                  >
                    Price {filters.sortBy === 'price' && (filters.sortOrder === 'asc' ? '▲' : '▼')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      filters.sortBy === 'starRating'
                        ? 'btn-success'
                        : 'btn-outline-secondary'
                    } text-start`}
                    onClick={() => {
                      const newOrder = filters.sortBy === 'starRating' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      handleFilterChange('sortBy', 'starRating');
                      handleFilterChange('sortOrder', newOrder);
                      performSearch();
                    }}
                  >
                    Star Rating {filters.sortBy === 'starRating' && (filters.sortOrder === 'asc' ? '▲' : '▼')}
                  </button>
                </div>
              </div>

              <hr />

              {/* Filter Section */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Filter</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="coupleFriendly"
                      checked={filters.coupleFriendly || false}
                      onChange={(e) => {
                        handleFilterChange('coupleFriendly', e.target.checked);
                        performSearch();
                      }}
                    />
                    <label className="form-check-label" htmlFor="coupleFriendly">
                      Couple Friendly
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="localId"
                      checked={filters.localId || false}
                      onChange={(e) => {
                        handleFilterChange('localId', e.target.checked);
                        performSearch();
                      }}
                    />
                    <label className="form-check-label" htmlFor="localId">
                      Local ID
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="payAtHotel"
                      checked={filters.payAtHotel || false}
                      onChange={(e) => {
                        handleFilterChange('payAtHotel', e.target.checked);
                        performSearch();
                      }}
                    />
                    <label className="form-check-label" htmlFor="payAtHotel">
                      Pay at Hotel
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newlyAdded"
                      checked={filters.newlyAdded || false}
                      onChange={(e) => {
                        handleFilterChange('newlyAdded', e.target.checked);
                        performSearch();
                      }}
                    />
                    <label className="form-check-label" htmlFor="newlyAdded">
                      Newly Added
                    </label>
                  </div>
                </div>
              </div>

              <hr />

              {/* Star Rating Section */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Star Rating</h6>
                <div className="d-flex flex-column gap-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div className="form-check" key={star}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`star${star}`}
                        checked={selectedStars.includes(star)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStars([...selectedStars, star]);
                          } else {
                            setSelectedStars(selectedStars.filter((s) => s !== star));
                          }
                          setTimeout(() => performSearch(), 100);
                        }}
                      />
                      <label className="form-check-label" htmlFor={`star${star}`}>
                        {star} Star
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <hr />

              {/* Location Section */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Location</h6>
                <div className="input-group input-group-sm mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                  <span className="input-group-text">
                    <i className="bi bi-search">🔍</i>
                  </span>
                </div>
                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '8px',
                  }}
                >
                  {localities
                    .filter((locality) =>
                      locality.toLowerCase().includes(locationSearch.toLowerCase())
                    )
                    .map((locality) => (
                      <div className="form-check" key={locality}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`locality-${locality}`}
                          checked={selectedLocalities.includes(locality)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocalities([...selectedLocalities, locality]);
                            } else {
                              setSelectedLocalities(
                                selectedLocalities.filter((l) => l !== locality)
                              );
                            }
                            setTimeout(() => performSearch(), 100);
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`locality-${locality}`}
                        >
                          {locality}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <hr />

              {/* Amenities Section */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Amenities</h6>
                <div className="d-flex flex-column gap-2">
                  {[
                    'Wifi',
                    'Bathtub',
                    'Breakfast',
                    'Parking',
                    'Hot Water',
                    'AC',
                    'Travel desk',
                    'Swimming Pool',
                    'Gym',
                  ].map((amenity) => (
                    <div className="form-check" key={amenity}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`amenity-${amenity}`}
                        checked={filters.amenities?.includes(amenity) || false}
                        onChange={(e) => {
                          const amenities = filters.amenities || [];
                          if (e.target.checked) {
                            handleFilterChange('amenities', [...amenities, amenity]);
                          } else {
                            handleFilterChange(
                              'amenities',
                              amenities.filter((a) => a !== amenity)
                            );
                          }
                          setTimeout(() => performSearch(), 100);
                        }}
                      />
                      <label className="form-check-label" htmlFor={`amenity-${amenity}`}>
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="col-lg-9">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Searching hotels...</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No hotels found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="row">
                {hotels.map((hotel) => (
                  <HotelCard 
                    key={hotel.id} 
                    hotel={hotel}
                    searchParams={{
                      checkInDate: searchForm.checkInDate,
                      checkOutDate: searchForm.checkOutDate,
                      checkInTime: searchForm.checkInTime,
                      checkOutTime: searchForm.checkOutTime,
                      rooms: searchForm.rooms,
                      adults: searchForm.adults,
                      children: searchForm.children,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .property-types-nav {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .property-type-card {
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 12px;
          padding: 12px 8px;
          position: relative;
          border: 2px solid #0d47a1;
          background: white;
        }
        .property-type-card:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
        }
        .property-type-card.active {
          background: #0d47a1;
          color: white;
          border-color: #0d47a1;
        }
        .property-type-card.active .property-type-label {
          color: white;
          font-weight: 600;
        }
        .property-type-image {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
          height: 140px;
          background: #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .property-type-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .property-type-label {
          font-size: 15px;
          font-weight: 500;
          color: #1f2937;
          margin-top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
        }
        .property-type-card.active .property-type-label {
          color: white;
        }
        .search-hero-section {
          background: #0d47a1;
          padding: 40px 0;
        }
        .search-form-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .search-form-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .search-field {
          padding: 0 12px;
        }
        .search-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 8px;
          display: block;
        }
        .search-input-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-input-wrapper:hover {
          border-color: #0d47a1;
        }
        .search-input-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .date-range-content {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .date-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .search-main-value {
          font-size: 16px;
          color: #1f2937;
          line-height: 1.2;
        }
        .search-sub-value {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.2;
        }
        .date-separator {
          color: #9ca3af;
          font-weight: 500;
          font-size: 18px;
          margin: 0 4px;
        }
        .btn-near-me {
          background: #fbbf24;
          color: #1f2937;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-near-me:hover {
          background: #f59e0b;
        }
        .dropdown-arrow {
          color: #9ca3af;
          font-size: 10px;
          margin-left: 8px;
        }
        .btn-search {
          width: 100%;
          background: #f97316;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-search:hover:not(:disabled) {
          background: #ea580c;
        }
        .btn-search:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .trip-type-checkboxes {
          padding-left: 12px;
        }
        .trip-type-checkboxes .form-check-input {
          margin-top: 0.3rem;
        }
        .trip-type-checkboxes .form-check-label {
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
