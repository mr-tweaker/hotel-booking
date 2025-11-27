// Hotel Card component - redesigned to match the new design
import Link from 'next/link';
import Image from 'next/image';
import { Hotel } from '@/types';

interface HotelCardProps {
  hotel: Hotel;
  searchParams?: {
    checkInDate?: string;
    checkOutDate?: string;
    checkInTime?: string;
    checkOutTime?: string;
    rooms?: number;
    adults?: number;
    children?: number;
  };
}

export default function HotelCard({ hotel, searchParams }: HotelCardProps) {
  // Build booking URL with search parameters
  const buildBookingUrl = () => {
    if (!searchParams) {
      return `/hotel?id=${hotel.id}`;
    }

    // Calculate check-in slot (hour of day, 0-23)
    const checkInTime = searchParams.checkInTime || '08:00';
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const checkInSlot = hours;

    // Calculate slot count (hours between check-in and check-out)
    const checkInDate = new Date(searchParams.checkInDate || '2025-11-22');
    const checkOutDate = new Date(searchParams.checkOutDate || '2025-11-23');
    const checkOutTime = searchParams.checkOutTime || '20:00';
    const [outHours, outMinutes] = checkOutTime.split(':').map(Number);
    
    const checkOutDateTime = new Date(checkOutDate);
    checkOutDateTime.setHours(outHours, outMinutes);
    
    const checkInDateTime = new Date(checkInDate);
    checkInDateTime.setHours(hours, minutes);
    
    const diffMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const slotCount = Math.ceil(diffMs / (1000 * 60 * 60)); // Convert to hours

    const params = new URLSearchParams({
      id: hotel.id,
      checkin_date: searchParams.checkInDate || '2025-11-22',
      checkin_slot: checkInSlot.toString(),
      slot_count: slotCount.toString(),
      room_count: (searchParams.rooms || 1).toString(),
      guest_count: ((searchParams.adults || 2) + (searchParams.children || 0)).toString(),
    });

    return `/hotel?${params.toString()}`;
  };
  const mainImage =
    hotel.images && hotel.images.length > 0
      ? hotel.images[0]
      : `https://source.unsplash.com/800x600/?hotel,room,${encodeURIComponent(hotel.locality)}`;

  const thumbnailImages = hotel.images?.slice(1, 4) || [];
  const hasMoreImages = (hotel.images?.length || 0) > 4;

  const currentPrice = hotel.price;
  const originalPrice = hotel.originalPrice || hotel.price * 1.5;
  const discount = hotel.discount || Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  const bag2bagDiscount = hotel.bag2bagDiscount || Math.round(currentPrice * 0.08);
  const finalPrice = currentPrice - bag2bagDiscount;

  const rating = hotel.rating || hotel.stars;
  const reviews = hotel.reviews || Math.floor(Math.random() * 500) + 5;
  const distance = hotel.distance || `${(Math.random() * 20 + 0.5).toFixed(2)} km from center of ${hotel.city || 'delhi'}`;
  const availability = hotel.availability || Math.floor(Math.random() * 5) + 1;

  // Derive room types from hourlyRooms (so listing matches Edit Property Application)
  const roomTypeLabels: string[] = Array.from(
    new Set(
      (hotel.hourlyRooms || [])
        .map((r: any) => (r && typeof r === 'object' ? (r as any).category : null))
        .filter((name: string | null): name is string => Boolean(name))
    )
  );

  // Calculate star display
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Get check-in charge from hotel data (stored in database, default 500)
  const checkInCharge = hotel.checkInCharge || 500;

  return (
    <div className="col-12 mb-4">
      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="row g-0">
          {/* Image Section */}
          <div className="col-md-4 position-relative">
            <div style={{ position: 'relative', height: '100%', minHeight: '300px' }}>
              <Image
                src={mainImage}
                alt={hotel.name}
                fill
                style={{ objectFit: 'cover' }}
                className="w-100"
              />
              {hotel.isPremium && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: '#FF6B35',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    zIndex: 2,
                  }}
                >
                  PREMIUM
                </div>
              )}
              
              {/* Thumbnail Images - Smaller size */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  gap: '6px',
                }}
              >
                {thumbnailImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '2px solid white',
                    }}
                  >
                    <Image
                      src={img}
                      alt={`${hotel.name} ${idx + 2}`}
                      width={80}
                      height={40}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
                {hasMoreImages && (
                  <div
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '600',
                      border: '2px solid white',
                      cursor: 'pointer',
                    }}
                  >
                    View all
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="col-md-8">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="card-title mb-0 fw-bold">{hotel.name}</h5>
                    {hotel.isCertified && (
                      <span
                        style={{
                          background: '#0d47a1',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        Certified
                      </span>
                    )}
                  </div>
                  <p className="text-muted small mb-1">
                    Hotel In {hotel.locality}, {hotel.city || 'Delhi'}
                  </p>
                  <p className="text-muted small mb-2">{distance}</p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm p-2"
                    style={{ border: '1px solid #dee2e6', background: 'white' }}
                    title="Add to favorites"
                  >
                    ❤️
                  </button>
                  <button
                    className="btn btn-sm p-2"
                    style={{ border: '1px solid #dee2e6', background: 'white' }}
                    title="Share"
                  >
                    🔗
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="d-flex align-items-center">
                  {[...Array(fullStars)].map((_, i) => (
                    <span key={i} style={{ color: '#FFC107', fontSize: '16px' }}>
                      ★
                    </span>
                  ))}
                  {hasHalfStar && (
                    <span style={{ color: '#FFC107', fontSize: '16px' }}>
                      ★
                    </span>
                  )}
                  {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                    <span key={i} style={{ color: '#ddd', fontSize: '16px' }}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="fw-semibold">{rating.toFixed(1)}</span>
                <span className="text-muted small">({reviews} Reviews)</span>
              </div>

              {/* Room Types */}
              {roomTypeLabels.length > 0 && (
                <div className="mb-3">
                  <span className="text-muted small me-2">Room Types:</span>
                  {roomTypeLabels.map((label) => (
                    <span
                      key={label}
                      className="badge bg-light text-dark border me-1"
                      style={{ fontSize: '11px', fontWeight: 500 }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Pricing */}
              <div className="mb-3">
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span
                    style={{
                      textDecoration: 'line-through',
                      color: '#6c757d',
                      fontSize: '14px',
                    }}
                  >
                    ₹{originalPrice.toLocaleString()}
                  </span>
                  <span
                    style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {discount}% Off
                  </span>
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span className="h4 fw-bold mb-0" style={{ color: '#0d47a1' }}>
                    ₹{finalPrice.toLocaleString()}
                  </span>
                  <span className="text-muted" style={{ fontSize: '12px' }}>
                    /hour
                  </span>
                </div>
                {/* Check-In Charge - Smaller font */}
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span className="text-muted" style={{ fontSize: '11px', color: '#6c757d' }}>
                    + Check-In Charge:
                  </span>
                  <span className="fw-semibold" style={{ fontSize: '15px', color: '#495057' }}>
                    ₹{checkInCharge.toLocaleString()}
                  </span>
                  <span className="text-muted" style={{ fontSize: '10px', color: '#6c757d' }}>
                    (one-time)
                  </span>
                </div>
                <p className="text-muted small mb-1" style={{ fontSize: '10px', fontStyle: 'italic' }}>
                  Total for 1 hour: ₹{(finalPrice + checkInCharge).toLocaleString()} | 2 hours: ₹{(finalPrice * 2 + checkInCharge).toLocaleString()} | 3 hours: ₹{(finalPrice * 3 + checkInCharge).toLocaleString()}
                </p>
                <p className="text-muted small mb-1">
                  Room Per Night (Exclusive Of Taxes & Fees)
                </p>
                {bag2bagDiscount > 0 && (
                  <p className="text-success small mb-0">
                    ₹{bag2bagDiscount.toLocaleString()} Bag2Bag Discount Applied
                  </p>
                )}
              </div>

              {/* Availability and Book Button */}
              <div className="d-flex justify-content-between align-items-center">
                {availability <= 3 && (
                  <span className="text-danger small fw-semibold">
                    Only {availability} Left
                  </span>
                )}
                <Link
                  href={buildBookingUrl()}
                  className="btn btn-primary"
                  style={{
                    background: '#0d47a1',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
