// Day Stay page - copied from Hourly Stay page
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelCard from '@/components/HotelCard';
import { Hotel, SearchFilters } from '@/types';
import { analyticsApi } from '@/lib/api-client';

// Demo hotels dataset
const HOTELS: Hotel[] = [
  {
    id: 'H1001',
    name: 'Connaught Place Comfort',
    locality: 'Connaught Place',
    price: 799,
    stars: 4,
    amenities: ['Wifi', 'Parking'],
  },
  {
    id: 'H1002',
    name: 'Saket Suites',
    locality: 'Saket',
    price: 599,
    stars: 3,
    amenities: ['Wifi', 'Pool'],
  },
  {
    id: 'H1003',
    name: 'Hauz Khas Inn',
    locality: 'Hauz Khas',
    price: 499,
    stars: 2,
    amenities: ['Wifi'],
  },
  {
    id: 'H1004',
    name: 'Dwarka Deluxe',
    locality: 'Dwarka',
    price: 999,
    stars: 5,
    amenities: ['Wifi', 'Parking', 'Pool'],
  },
  {
    id: 'NTR001',
    name: 'Nature on the Rocks',
    locality: 'Rishikesh',
    price: 1299,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'Bathtub'],
    images: [
      '/assets/images/natureontherocks/nature1.jpg',
      '/assets/images/natureontherocks/nature2.jpg',
      '/assets/images/natureontherocks/nature3.jpg',
      '/assets/images/natureontherocks/nature4.jpg',
    ],
    description:
      'Cliffside property in Rishikesh — great views and relaxing dining patio.',
  },
];

type PropertyType = 'hotels' | 'homestays' | 'resorts';

export default function DayStayPage() {
  const [hotels, setHotels] = useState<Hotel[]>(HOTELS);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('hotels');
  const [searchCity, setSearchCity] = useState('Delhi');
  const [searchCountry, setSearchCountry] = useState('India');

  useEffect(() => {
    analyticsApi.trackEvent('visit_day_stay');
  }, []);

  useEffect(() => {
    // Update search city based on property type
    if (selectedPropertyType === 'homestays') {
      setSearchCity('Coorg');
      setSearchCountry('India');
    } else if (selectedPropertyType === 'resorts') {
      setSearchCity('Manali');
      setSearchCountry('India');
    } else {
      setSearchCity('Delhi');
      setSearchCountry('India');
    }
  }, [selectedPropertyType]);

  const applyFilters = () => {
    let filtered = [...HOTELS];

    if (filters.locality && filters.locality !== 'All') {
      filtered = filtered.filter((h) => h.locality === filters.locality);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((h) => h.price <= filters.maxPrice);
    }

    if (filters.stars && filters.stars !== 'any') {
      filtered = filtered.filter((h) => h.stars === Number(filters.stars));
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((h) =>
        filters.amenities!.every((a) => (h.amenities || []).includes(a))
      );
    }

    setHotels(filtered);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
            <form
              className="search-form-card"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              <div className="row g-0 align-items-end">
                <div className="col-md-4">
                  <div className="search-field">
                    <label className="search-label">City, Locality Or Property</label>
                    <div className="search-input-wrapper">
                      <div className="search-input-content">
                        <div className="search-main-value">
                          <strong>{searchCity}</strong>
                        </div>
                        <div className="search-sub-value">{searchCountry}</div>
                      </div>
                      <button type="button" className="btn-near-me">
                        {selectedPropertyType === 'resorts' ? (
                          <span style={{ marginRight: '4px' }}>✔</span>
                        ) : (
                          <span style={{ marginRight: '4px' }}>✈</span>
                        )}
                        Near me
                      </button>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="search-field">
                    <label className="search-label">Check-In Check-Out Date</label>
                    <div className="search-input-wrapper">
                      <div className="search-input-content date-range-content">
                        <div className="date-item">
                          <div className="search-main-value">20 Dec 2025</div>
                          <div className="search-sub-value">Sat, 20 Dec 2025</div>
                        </div>
                        <span className="date-separator">-</span>
                        <div className="date-item">
                          <div className="search-main-value">21 Dec 2025</div>
                          <div className="search-sub-value">Sun, 21 Dec 2025</div>
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Check-In Time</label>
                    <div className="search-input-wrapper">
                      <div className="search-input-content">
                        <div className="search-main-value">12:00 PM</div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Check-Out Time</label>
                    <div className="search-input-wrapper">
                      <div className="search-input-content">
                        <div className="search-main-value">07:00 PM</div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="search-field">
                    <label className="search-label">Guest</label>
                    <div className="search-input-wrapper">
                      <div className="search-input-content">
                        <div className="search-main-value">
                          <strong>1 Room</strong> <strong>2 Adult</strong>
                        </div>
                      </div>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-1">
                  <button type="submit" className="btn-search">
                    Search
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
              <h6 className="fw-semibold">Filters</h6>

              <label className="form-label mt-2">Locality</label>
              <select
                id="filterLocality"
                className="form-select mb-2"
                value={filters.locality || 'All'}
                onChange={(e) => handleFilterChange('locality', e.target.value)}
              >
                <option value="All">All Delhi</option>
                <option>Connaught Place</option>
                <option>Karol Bagh</option>
                <option>Saket</option>
                <option>Hauz Khas</option>
                <option>Dwarka</option>
                <option>Rohini</option>
                <option>Janakpuri</option>
              </select>

              <label className="form-label mt-2">Price range (₹)</label>
              <input
                id="priceRange"
                type="range"
                min="200"
                max="5000"
                value={filters.maxPrice || 3000}
                className="form-range"
                onChange={(e) =>
                  handleFilterChange('maxPrice', Number(e.target.value))
                }
              />

              <label className="form-label mt-3">Hotel type</label>
              <select
                id="filterStars"
                className="form-select mb-2"
                value={filters.stars || 'any'}
                onChange={(e) => handleFilterChange('stars', e.target.value)}
              >
                <option value="any">Any</option>
                <option value="1">1 star</option>
                <option value="2">2 star</option>
                <option value="3">3 star</option>
                <option value="4">4 star</option>
                <option value="5">5 star</option>
              </select>

              <label className="form-label mt-2">Amenities</label>
              <div className="form-check">
                <input
                  className="form-check-input amen"
                  type="checkbox"
                  value="Wifi"
                  id="amenWifi"
                  checked={filters.amenities?.includes('Wifi') || false}
                  onChange={(e) => {
                    const amenities = filters.amenities || [];
                    if (e.target.checked) {
                      handleFilterChange('amenities', [...amenities, 'Wifi']);
                    } else {
                      handleFilterChange(
                        'amenities',
                        amenities.filter((a) => a !== 'Wifi')
                      );
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="amenWifi">
                  Wi-Fi
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input amen"
                  type="checkbox"
                  value="Parking"
                  id="amenParking"
                  checked={filters.amenities?.includes('Parking') || false}
                  onChange={(e) => {
                    const amenities = filters.amenities || [];
                    if (e.target.checked) {
                      handleFilterChange('amenities', [...amenities, 'Parking']);
                    } else {
                      handleFilterChange(
                        'amenities',
                        amenities.filter((a) => a !== 'Parking')
                      );
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="amenParking">
                  Parking
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input amen"
                  type="checkbox"
                  value="Bathtub"
                  id="amenTub"
                  checked={filters.amenities?.includes('Bathtub') || false}
                  onChange={(e) => {
                    const amenities = filters.amenities || [];
                    if (e.target.checked) {
                      handleFilterChange('amenities', [...amenities, 'Bathtub']);
                    } else {
                      handleFilterChange(
                        'amenities',
                        amenities.filter((a) => a !== 'Bathtub')
                      );
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="amenTub">
                  Bathtub
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input amen"
                  type="checkbox"
                  value="Pool"
                  id="amenPool"
                  checked={filters.amenities?.includes('Pool') || false}
                  onChange={(e) => {
                    const amenities = filters.amenities || [];
                    if (e.target.checked) {
                      handleFilterChange('amenities', [...amenities, 'Pool']);
                    } else {
                      handleFilterChange(
                        'amenities',
                        amenities.filter((a) => a !== 'Pool')
                      );
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="amenPool">
                  Swimming Pool
                </label>
              </div>

              <button
                id="applyFilterBtn"
                className="btn btn-outline-primary mt-3 w-100"
                onClick={applyFilters}
              >
                Apply filters
              </button>
            </div>
          </aside>

          <section className="col-lg-9">
            <div className="row g-4">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
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
        .property-type-image {
          position: relative;
        }
        .overlay-icons {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
        }
        .overlay-icons .icon-clock,
        .overlay-icons .icon-person {
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        .btn-search:hover {
          background: #ea580c;
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

