'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GoogleMapPicker from '@/components/GoogleMapPicker';
import { apiFormRequest } from '@/lib/api-client';

export default function ListPropertyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);
  const [overnightRoomCount, setOvernightRoomCount] = useState(0);
  const [packageCount, setPackageCount] = useState(0);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  // Cache for storing charge values per package and category
  const packageChargesCache = useRef<
    Record<
      string,
      Record<
        string,
        {
          generalCharge?: string;
          hourlyCharge?: string;
          checkInCharge?: string;
        }
      >
    >
  >({});
  
  // Cache for storing room amenities per overnight room and room type
  const overnightRoomAmenitiesCache = useRef<Record<string, Record<string, string[]>>>({});
  
  
  // Booking Type categories state
  const [bookingTypeCategories, setBookingTypeCategories] = useState<string[]>([]);
  const addCustomRoomTypeValue = '__add_custom_room_type__';
  
  // Amenities state
  const [selectedHotelAmenities, setSelectedHotelAmenities] = useState<string[]>([]);
  
  // Places of Interest state
  const [placesOfInterest, setPlacesOfInterest] = useState<Array<{ name: string; distance: string }>>([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDistance, setNewPlaceDistance] = useState('');
  
  // Google Maps location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Amenities lists (matching hotel page)
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

  useEffect(() => {
    const fromSignup =
      searchParams.get('from') === 'signup' ||
      (typeof window !== 'undefined' &&
        sessionStorage.getItem('justSignedUp') === 'true');

    if (fromSignup) {
      setShowWelcome(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('justSignedUp');

        // Pre-fill email if available from signup
        try {
          const signupData = JSON.parse(
            sessionStorage.getItem('signupData') || '{}'
          );
          if (signupData.email) {
            const ownerEmailInput = document.querySelector(
              'input[name="ownerEmail"]'
            ) as HTMLInputElement;
            const receptionEmailInput = document.querySelector(
              'input[name="receptionEmail"]'
            ) as HTMLInputElement;
            if (ownerEmailInput) ownerEmailInput.value = signupData.email;
            if (receptionEmailInput) receptionEmailInput.value = signupData.email;
          }
          if (signupData.phone) {
            const ownerMobileInput = document.querySelector(
              'input[name="ownerMobile"]'
            ) as HTMLInputElement;
            const receptionMobileInput = document.querySelector(
              'input[name="receptionMobile"]'
            ) as HTMLInputElement;
            if (ownerMobileInput) ownerMobileInput.value = signupData.phone;
            if (receptionMobileInput) receptionMobileInput.value = signupData.phone;
          }
          sessionStorage.removeItem('signupData');
        } catch (e) {
          console.log('No signup data to pre-fill');
        }
      }
    }
  }, [searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          previews.push(event.target.result as string);
          if (previews.length === files.length) {
            setImagePreview(previews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
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
    setLoading(true);

    const form = e.currentTarget;
    if (!form) {
      console.error('Form element not found');
      setLoading(false);
      return;
    }

    const formData = new FormData(form);
    
    // Add amenities and places of interest to form data
    selectedHotelAmenities.forEach(amenity => {
      formData.append('hotelAmenities[]', amenity);
    });
    
    placesOfInterest.forEach((place, index) => {
      formData.append(`placesOfInterest[${index}][name]`, place.name);
      if (place.distance) {
        formData.append(`placesOfInterest[${index}][distance]`, place.distance);
      }
    });
    
    // Add location coordinates
    if (location) {
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
    }
    
    // Add booking type categories
    bookingTypeCategories.forEach(category => {
      formData.append('bookingTypeCategories[]', category);
    });

    try {
      const result = await apiFormRequest('/property/list', formData);

      if (result.success && result.data) {
        // Get the application ID from the response
        // The API returns { success: true, data: { listingId: '...', ... } }
        const propertyData = result.data as any;
        const applicationId = propertyData?.listingId || propertyData?.data?.listingId;
        
        if (applicationId) {
          setSubmittedApplicationId(applicationId);
        }
        
        // Reset form safely
        if (form && typeof form.reset === 'function') {
          form.reset();
        }
        
        // Reset state
        setOvernightRoomCount(0);
        setPackageCount(0);
        setImagePreview([]);
        setSelectedHotelAmenities([]);
        setPlacesOfInterest([]);
        setLocation(null);
        setBookingTypeCategories([]);
        
        // Clear dynamic fields
        const overnightContainer = document.getElementById('overnightRooms');
        const packagesContainer = document.getElementById('packages');
        if (overnightContainer) overnightContainer.innerHTML = '';
        if (packagesContainer) packagesContainer.innerHTML = '';
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Error: ' + (result.error || 'Failed to submit application'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const baseRoomTypeOptions = ['Normal', 'Deluxe'];
  const customRoomTypeOptionValue = '__add_custom_room_type__';

  const addOvernightRoom = () => {
    const container = document.getElementById('overnightRooms');
    if (!container) return;

    const roomId = 'overnight_' + overnightRoomCount;
    setOvernightRoomCount((prev) => prev + 1);

    // Initialize cache for this room if not exists
    if (!overnightRoomAmenitiesCache.current[roomId]) {
      overnightRoomAmenitiesCache.current[roomId] = {};
    }

    const roomAmenitiesHtml = roomAmenitiesList
      .map(
        (amenity, idx) => `
      <div class="col-md-3 col-sm-4 col-6">
        <div class="form-check">
          <input
            class="form-check-input overnight-room-amenity-checkbox"
            type="checkbox"
            data-room-id="${roomId}"
            data-amenity-name="${amenity.name}"
            id="overnight-room-amenity-${roomId}-${idx}"
            name="overnightRooms[${roomId}][roomAmenities][]"
            value="${amenity.name}"
          />
          <label class="form-check-label" for="overnight-room-amenity-${roomId}-${idx}">
            <span style="font-size: 18px; margin-right: 8px;">${amenity.icon}</span>
            ${amenity.name}
          </label>
        </div>
      </div>
    `,
      )
      .join('');

    const roomHtml = `
      <div class="room-item" id="${roomId}">
        <button type="button" class="btn btn-sm btn-danger remove-btn" onclick="document.getElementById('${roomId}').remove()">×</button>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Room Type</label>
            <select name="overnightRooms[${roomId}][category]" class="form-select overnight-room-type-select" data-room-id="${roomId}">
              <option value="">Select Room Type</option>
              ${baseRoomTypeOptions.map((type) => `<option value="${type}">${type}</option>`).join('')}
              <option value="${customRoomTypeOptionValue}">+ Add Room Type</option>
            </select>
          </div>
          <div class="col-md-12 overnight-room-amenities-section" data-room-id="${roomId}" style="display: none;">
            <label class="form-label">Room Amenities</label>
            <div class="row g-3">
              ${roomAmenitiesHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', roomHtml);
    
    // Handle custom room type addition and amenities caching
    setTimeout(() => {
      const selectElement = container.querySelector(`.overnight-room-type-select[data-room-id="${roomId}"]`) as HTMLSelectElement;
      const amenitiesSection = container.querySelector(`.overnight-room-amenities-section[data-room-id="${roomId}"]`) as HTMLElement;
      const amenityCheckboxes = container.querySelectorAll(`.overnight-room-amenity-checkbox[data-room-id="${roomId}"]`) as NodeListOf<HTMLInputElement>;

      if (selectElement && amenitiesSection) {
        selectElement.addEventListener('change', function () {
          const previousValue = this.getAttribute('data-previous-room-type') || '';
          let newRoomType = this.value;

          if (newRoomType === customRoomTypeOptionValue) {
            const customType = window.prompt('Enter new room type');
            if (customType && customType.trim()) {
              const trimmed = customType.trim();
              const exists = Array.from(this.options).some((option) => option.value === trimmed);
              if (!exists) {
                const option = document.createElement('option');
                option.value = trimmed;
                option.textContent = trimmed;
                this.insertBefore(option, this.querySelector(`option[value="${customRoomTypeOptionValue}"]`));
              }
              newRoomType = trimmed;
              this.value = trimmed;
            } else {
              this.value = previousValue;
              return;
            }
          }

          // Save current checked amenities to cache before switching
          if (previousValue && amenityCheckboxes.length > 0) {
            const checkedAmenities: string[] = [];
            amenityCheckboxes.forEach((checkbox) => {
              if (checkbox.checked) {
                checkedAmenities.push(checkbox.getAttribute('data-amenity-name') || '');
              }
            });
            overnightRoomAmenitiesCache.current[roomId][previousValue] = checkedAmenities;
          }

          // Show/hide amenities section
          if (newRoomType) {
            amenitiesSection.style.display = 'block';
            const cachedAmenities = overnightRoomAmenitiesCache.current[roomId]?.[newRoomType] || [];
            amenityCheckboxes.forEach((checkbox) => {
              const amenityName = checkbox.getAttribute('data-amenity-name');
              checkbox.checked = cachedAmenities.includes(amenityName || '');
            });
          } else {
            amenitiesSection.style.display = 'none';
            amenityCheckboxes.forEach((checkbox) => {
              checkbox.checked = false;
            });
          }

          this.setAttribute('data-previous-room-type', newRoomType);
        });

        // Track checkbox changes to keep cache updated
        amenityCheckboxes.forEach((checkbox) => {
          checkbox.addEventListener('change', function () {
            const currentRoomType = selectElement.value;
            if (!currentRoomType) return;

            if (!overnightRoomAmenitiesCache.current[roomId][currentRoomType]) {
              overnightRoomAmenitiesCache.current[roomId][currentRoomType] = [];
            }

            const amenityName = this.getAttribute('data-amenity-name') || '';
            if (this.checked) {
              if (!overnightRoomAmenitiesCache.current[roomId][currentRoomType].includes(amenityName)) {
                overnightRoomAmenitiesCache.current[roomId][currentRoomType].push(amenityName);
              }
            } else {
              overnightRoomAmenitiesCache.current[roomId][currentRoomType] =
                overnightRoomAmenitiesCache.current[roomId][currentRoomType].filter((a) => a !== amenityName);
            }
          });
        });
      }
    }, 0);
  };


  const addPackage = () => {
    const container = document.getElementById('packages');
    if (!container) return;

    const packageId = 'package_' + packageCount;
    setPackageCount((prev) => prev + 1);

    const packageHtml = `
      <div class="package-item" id="${packageId}">
        <button type="button" class="btn btn-sm btn-danger remove-btn" onclick="document.getElementById('${packageId}').remove()">×</button>
        <div class="row g-3">
          <div class="col-md-12">
            <label class="form-label">Booking Duration</label>
            <select name="packages[${packageId}][duration]" class="form-select package-duration-select" data-package-id="${packageId}">
              <option value="">Select Duration</option>
              <option value="Hourly">Hourly</option>
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="24 hours">24 hours</option>
            </select>
          </div>
          <div class="col-md-12">
          <label class="form-label">Room Category</label>
          <select name="packages[${packageId}][category]" class="form-select package-category-select" data-package-id="${packageId}">
            <option value="">Select Room Category</option>
            <option value="Normal">Normal</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Super Deluxe">Super Deluxe</option>
            <option value="King">King</option>
            <option value="__add_custom_room_type__">+ Add Room Type</option>
          </select>
        </div>
          <div class="col-md-6 package-hourly-wrapper" data-package-id="${packageId}" style="display: none;">
            <label class="form-label">Hourly Charge</label>
            <input type="number" name="packages[${packageId}][hourlyCharge]" class="form-control package-hourly-charge" data-package-id="${packageId}" placeholder="Hourly Charge" value="">
          </div>
          <div class="col-md-6 package-checkin-wrapper" data-package-id="${packageId}" style="display: none;">
            <label class="form-label package-charge-label" data-package-id="${packageId}">Check-in Charge</label>
            <input type="number" name="packages[${packageId}][checkInCharge]" class="form-control package-checkin-charge" data-package-id="${packageId}" placeholder="Check-in Charge" value="">
          </div>
          <div class="col-12">
            <div class="row">
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][roomDecorate]" id="decorate_${packageId}">
                  <label class="form-check-label" for="decorate_${packageId}">Is Room decorate</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][welcomeDrink]" id="drink_${packageId}">
                  <label class="form-check-label" for="drink_${packageId}">Is Welcome Drink</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][candleDinner]" id="dinner_${packageId}">
                  <label class="form-check-label" for="dinner_${packageId}">Is Candle Night Dinner</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][breakfast]" id="breakfast_${packageId}">
                  <label class="form-check-label" for="breakfast_${packageId}">Is Breakfast</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][buffet]" id="buffet_${packageId}">
                  <label class="form-check-label" for="buffet_${packageId}">Is Buffet</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][alacarte]" id="alacarte_${packageId}">
                  <label class="form-check-label" for="alacarte_${packageId}">Is Alacarte</label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="packages[${packageId}][spa]" id="spa_${packageId}">
                  <label class="form-check-label" for="spa_${packageId}">Is Spa</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', packageHtml);
    
    // Add event listener to toggle charge fields based on category selection
    setTimeout(() => {
      const categorySelect = container.querySelector(`.package-category-select[data-package-id="${packageId}"]`) as HTMLSelectElement;
      const durationSelect = container.querySelector(`.package-duration-select[data-package-id="${packageId}"]`) as HTMLSelectElement;
      const hourlyWrapper = container.querySelector(`.package-hourly-wrapper[data-package-id="${packageId}"]`) as HTMLElement;
      const checkinWrapper = container.querySelector(`.package-checkin-wrapper[data-package-id="${packageId}"]`) as HTMLElement;
      const hourlyInput = container.querySelector(`.package-hourly-charge[data-package-id="${packageId}"]`) as HTMLInputElement;
      const checkinInput = container.querySelector(`.package-checkin-charge[data-package-id="${packageId}"]`) as HTMLInputElement;
      const chargeLabel = container.querySelector(`.package-charge-label[data-package-id="${packageId}"]`) as HTMLElement;
      
      const ensureCache = (pkgId: string, category: string) => {
        if (!packageChargesCache.current[pkgId]) {
          packageChargesCache.current[pkgId] = {};
        }
        if (!packageChargesCache.current[pkgId][category]) {
          packageChargesCache.current[pkgId][category] = {
            generalCharge: '',
            hourlyCharge: '',
            checkInCharge: '',
          };
        }
        return packageChargesCache.current[pkgId][category];
      };

      const storeCurrentValues = (category: string | null) => {
        if (!category) return;
        const cache = ensureCache(packageId, category);
        if (durationSelect?.value === 'Hourly') {
          cache.hourlyCharge = hourlyInput?.value || '';
          cache.checkInCharge = checkinInput?.value || '';
        } else {
          cache.generalCharge = checkinInput?.value || '';
        }
      };

      const applyCachedValues = (category: string | null) => {
        if (!category) {
          if (hourlyInput) hourlyInput.value = '';
          if (checkinInput) checkinInput.value = '';
          return;
        }
        const cache = packageChargesCache.current[packageId]?.[category];
        if (durationSelect?.value === 'Hourly') {
          if (hourlyInput) hourlyInput.value = cache?.hourlyCharge || '';
          if (checkinInput) checkinInput.value = cache?.checkInCharge || '';
        } else {
          if (checkinInput) checkinInput.value = cache?.generalCharge || '';
        }
      };

      const updateChargeLabel = () => {
        if (!chargeLabel) return;
        const duration = durationSelect?.value;
        let labelText = 'Check-in Charge';
        if (duration === 'Hourly') {
          labelText = 'Check-in Charge';
        } else if (duration === 'Day') {
          labelText = 'Day Charge';
        } else if (duration === 'Night') {
          labelText = 'Night Charge';
        } else if (duration === '24 hours') {
          labelText = '24-Hour Charge';
        }
        chargeLabel.textContent = labelText;
        if (checkinInput) {
          checkinInput.placeholder = labelText;
        }
      };
      
      const updateChargeVisibility = () => {
        const hasCategory = Boolean(categorySelect?.value);
        if (!hasCategory) {
          if (hourlyWrapper) hourlyWrapper.style.display = 'none';
          if (checkinWrapper) checkinWrapper.style.display = 'none';
          return;
        }

        if (durationSelect?.value === 'Hourly') {
          if (hourlyWrapper) hourlyWrapper.style.display = 'block';
          if (checkinWrapper) checkinWrapper.style.display = 'block';
        } else {
          if (hourlyWrapper) hourlyWrapper.style.display = 'none';
          if (checkinWrapper) checkinWrapper.style.display = 'block';
        }
        updateChargeLabel();
      };

      if (durationSelect) {
        durationSelect.addEventListener('change', updateChargeLabel);
        durationSelect.addEventListener('change', () => {
          storeCurrentValues(categorySelect?.value || '');
          updateChargeVisibility();
          applyCachedValues(categorySelect?.value || '');
        });
        updateChargeVisibility();
        updateChargeLabel();
      }
      
      if (categorySelect) {
        categorySelect.addEventListener('change', function () {
          const previousCategory = categorySelect.getAttribute('data-previous-category') || '';
          let newCategory = this.value;

          // Handle "+ Add Room Type"
          if (newCategory === addCustomRoomTypeValue) {
            const customType = window.prompt('Enter new room type');
            if (customType && customType.trim()) {
              newCategory = customType.trim();

              // Insert new option before "+ Add Room Type"
              const newOption = document.createElement('option');
              newOption.value = newCategory;
              newOption.textContent = newCategory;
              const addOption = categorySelect.querySelector(
                `option[value="${addCustomRoomTypeValue}"]`
              );
              categorySelect.insertBefore(newOption, addOption || null);
              categorySelect.value = newCategory;
            } else {
              // Revert to previous category if user cancels
              categorySelect.value = previousCategory;
              return;
            }
          }

          storeCurrentValues(previousCategory);

          if (newCategory) {
            updateChargeVisibility();
            applyCachedValues(newCategory);
          } else {
            if (hourlyWrapper) hourlyWrapper.style.display = 'none';
            if (checkinWrapper) checkinWrapper.style.display = 'none';
            if (hourlyInput) hourlyInput.value = '';
            if (checkinInput) checkinInput.value = '';
          }

          categorySelect.setAttribute('data-previous-category', newCategory);
        });
      }
    }, 0);
  };

  return (
    <>
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        {/* Left Sidebar Navigation */}
        <aside className="sidebar-nav">
          <div className="sidebar-content">
            <Link href="/" className="sidebar-brand">
              BookingHours.com
            </Link>
            <nav className="sidebar-menu">
              <Link href="/" className="sidebar-menu-item">
                <span className="menu-icon">📊</span>
                <span>Hourly Stay.</span>
              </Link>
              <Link href="/day-stay" className="sidebar-menu-item">
                <span className="menu-icon">🏠</span>
                <span>Day Stay.</span>
              </Link>
              <Link href="/list-property" className="sidebar-menu-item active">
                <span className="menu-icon">📋</span>
                <span>List Your Property</span>
              </Link>
              <Link href="/login" className="sidebar-menu-item">
                <span className="menu-icon">👤</span>
                <span>Login / Register</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="container-fluid py-4">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="text-center mb-4">
                  <h1 className="display-5 fw-bold">List Your Property</h1>
                  <p className="lead text-muted">
                    Join BookingHours and reach thousands of travelers looking for hourly stays.
                  </p>
                  {showWelcome && (
                    <div className="alert alert-success" role="alert">
                      <strong>Welcome!</strong> Your account has been created successfully. Please fill out the form below to list your property.
                    </div>
                  )}
                  {submittedApplicationId && (
                    <div className="alert alert-success" role="alert">
                      <h5 className="alert-heading">Application Submitted Successfully! 🎉</h5>
                      <p className="mb-2">
                        <strong>Your Application ID:</strong>{' '}
                        <code className="bg-light px-2 py-1 rounded">{submittedApplicationId}</code>
                      </p>
                      <p className="mb-3">
                        We will contact you within 24 hours. You can edit your application anytime using the links below.
                      </p>
                      <div className="d-flex gap-2 flex-wrap">
                        <Link
                          href={`/edit-property/${submittedApplicationId}`}
                          className="btn btn-primary"
                        >
                          Edit Application
                        </Link>
                        <Link
                          href="/my-applications"
                          className="btn btn-outline-primary"
                        >
                          View All My Applications
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setSubmittedApplicationId(null)}
                        >
                          Dismiss
                        </button>
                      </div>
                      <hr />
                      <p className="mb-0 small text-muted">
                        <strong>Note:</strong> Save your Application ID ({submittedApplicationId}) to access your application later.
                      </p>
                    </div>
                  )}
                </div>

                <form id="propertyForm" encType="multipart/form-data" onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h5 className="mb-4">Fill this form to List your Property on BookingHours</h5>

                    <div className="row g-3">
                      {/* Column 1 */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Property Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="propertyName"
                          className="form-control"
                          placeholder="Property Name"
                          required
                        />

                        <label className="form-label mt-3">
                          Owner Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          name="ownerMobile"
                          className="form-control"
                          placeholder="Owner Mobile Number"
                          required
                        />

                        <label className="form-label mt-3">
                          Owner Email Id <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          name="ownerEmail"
                          className="form-control"
                          placeholder="Owner Email Id"
                          required
                        />

                        <label className="form-label mt-3">
                          State <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          className="form-control"
                          placeholder="State"
                          required
                        />

                        <label className="form-label mt-3">Landmark</label>
                        <input
                          type="text"
                          name="landmark"
                          className="form-control"
                          placeholder="Landmark"
                        />

                        <label className="form-label mt-3">GST No</label>
                        <input
                          type="text"
                          name="gstNo"
                          className="form-control"
                          placeholder="GST No"
                        />
                        <label className="form-label mt-2 small">Upload GST Certificate</label>
                        <input
                          type="file"
                          name="gstCertificate"
                          className="form-control"
                          accept=".pdf,.jpeg,.jpg,.png,.webp"
                        />
                        <small className="text-muted d-block mt-1">
                          Upto 1 File, Max 5MB each (PDF, JPEG, PNG, WEBP)
                        </small>
                      </div>

                      {/* Column 2 */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Property Type <span className="text-danger">*</span>
                        </label>
                        <select name="propertyType" className="form-select" required>
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

                        <label className="form-label mt-3">Reception Landline Number</label>
                        <input
                          type="tel"
                          name="receptionLandline"
                          className="form-control"
                          placeholder="Reception Landline Number"
                        />

                        <label className="form-label mt-3">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          placeholder="City"
                          required
                        />

                        <label className="form-label mt-3">
                          Address <span className="text-danger">*</span>
                        </label>
                        <textarea
                          name="address"
                          className="form-control"
                          rows={3}
                          placeholder="Address"
                          required
                        ></textarea>

                        <label className="form-label mt-3">Google Business Page Link</label>
                        <input
                          type="url"
                          name="googleBusinessLink"
                          className="form-control"
                          placeholder="Google Business Page Link"
                        />

                        <label className="form-label mt-3">PAN No</label>
                        <input
                          type="text"
                          name="panNo"
                          className="form-control"
                          placeholder="PAN No"
                        />
                        <label className="form-label mt-2 small">Upload PAN Card</label>
                        <input
                          type="file"
                          name="panCard"
                          className="form-control"
                          accept=".pdf,.jpeg,.jpg,.png,.webp"
                        />
                        <small className="text-muted d-block mt-1">
                          Upto 1 File, Max 5MB each (PDF, JPEG, PNG, WEBP)
                        </small>
                      </div>

                      {/* Column 3 */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Reception Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          name="receptionMobile"
                          className="form-control"
                          placeholder="Reception Mobile Number"
                          required
                        />

                        <label className="form-label mt-3">
                          Reception Email Id <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          name="receptionEmail"
                          className="form-control"
                          placeholder="Reception Email Id"
                          required
                        />

                        <label className="form-label mt-3">Locality</label>
                        <input
                          type="text"
                          name="locality"
                          className="form-control"
                          placeholder="Locality"
                        />

                        <label className="form-label mt-3">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          className="form-control"
                          placeholder="Pincode"
                        />

                        <label className="form-label mt-3">Upload Property Images</label>
                        <div
                          className="file-upload-area"
                          onClick={() =>
                            document.getElementById('propertyImages')?.click()
                          }
                        >
                          <input
                            type="file"
                            id="propertyImages"
                            name="propertyImages"
                            multiple
                            accept=".jpeg,.jpg,.png,.webp"
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                          <div style={{ fontSize: '2rem', color: '#0d6efd' }}>📷</div>
                          <p className="mt-2 mb-0">Click to upload</p>
                          <small className="text-muted">
                            Upto 20 File, Max 5MB each (JPEG, PNG, WEBP)
                          </small>
                        </div>
                        {imagePreview.length > 0 && (
                          <div className="mt-3 d-flex flex-wrap gap-2">
                            {imagePreview.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                }}
                                alt={`Preview ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="form-section">
                    <h5>Room Details</h5>
                    <div id="overnightRooms"></div>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={addOvernightRoom}
                    >
                      + Add Room
                    </button>
                  </div>

                  {/* Booking Type */}
                  <div className="form-section">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Booking Type</h5>
                    </div>
                    <div id="packages"></div>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={addPackage}
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
                                id="bookingTypeHourly"
                                checked={bookingTypeCategories.includes('Hourly')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBookingTypeCategories([...bookingTypeCategories, 'Hourly']);
                                  } else {
                                    setBookingTypeCategories(bookingTypeCategories.filter(c => c !== 'Hourly'));
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor="bookingTypeHourly">
                                Hourly
                              </label>
                            </div>
                          </div>
                          <div className="col-md-3 col-sm-6 col-12">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="bookingTypeDay"
                                checked={bookingTypeCategories.includes('Day')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBookingTypeCategories([...bookingTypeCategories, 'Day']);
                                  } else {
                                    setBookingTypeCategories(bookingTypeCategories.filter(c => c !== 'Day'));
                                  }
                                }}
                              />
                              <label className="form-check-label" htmlFor="bookingTypeDay">
                                Day
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div className="form-section">
                    <h5>Amenities</h5>
                    
                    {/* Hotel Amenities */}
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

                  {/* Places of Interest Section */}
                  <div className="form-section">
                    <h5>Places of Interest</h5>
                    <p className="text-muted small mb-3">
                      Add nearby places of interest that guests might want to visit (e.g., Metro Station, Airport, Tourist Attractions)
                    </p>
                    
                    {/* Add New Place */}
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Place Name (e.g., Aerocity Metro Station)"
                          value={newPlaceName}
                          onChange={(e) => setNewPlaceName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addPlaceOfInterest();
                            }
                          }}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Distance (e.g., 0.4 km)"
                          value={newPlaceDistance}
                          onChange={(e) => setNewPlaceDistance(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addPlaceOfInterest();
                            }
                          }}
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

                    {/* List of Added Places */}
                    {placesOfInterest.length > 0 && (
                      <div className="list-group">
                        {placesOfInterest.map((place, idx) => (
                          <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
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
                    
                    {placesOfInterest.length === 0 && (
                      <div className="text-muted text-center py-3" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
                        No places of interest added yet. Add places above.
                      </div>
                    )}
                  </div>

                  {/* Google Maps Location Section */}
                  <div className="form-section">
                    <h5>Property Location on Map</h5>
                    <p className="text-muted small mb-3">
                      Click on the map or drag the marker to pinpoint your property's exact location. This will help guests find your property easily.
                    </p>
                    <GoogleMapPicker
                      onLocationSelect={(lat, lng) => {
                        setLocation({ lat, lng });
                      }}
                      height="400px"
                    />
                    {location && (
                      <div className="mt-2 alert alert-info">
                        <strong>Location Selected:</strong> Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
                      </div>
                    )}
                    {!location && (
                      <div className="mt-2 alert alert-warning">
                        <strong>Note:</strong> Please select your property location on the map above.
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="text-center my-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg px-5"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      <style jsx>{`
        .sidebar-nav {
          width: 260px;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
        }
        .sidebar-content {
          padding: 24px 16px;
        }
        .sidebar-brand {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #0d47a1;
          text-decoration: none;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #1f2937;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .sidebar-menu-item:hover {
          background: #f3f4f6;
          color: #0d47a1;
        }
        .sidebar-menu-item.active {
          background: #e6f0ff;
          color: #0d47a1;
          font-weight: 600;
        }
        .menu-icon {
          font-size: 20px;
        }
        .main-content {
          flex: 1;
          margin-left: 260px;
          background: #f9fafb;
        }
        .form-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .form-section h5 {
          color: #0d47a1;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #eef2ff;
        }
        .room-item,
        .package-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          position: relative;
        }
        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .file-upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.3s;
        }
        .file-upload-area:hover {
          border-color: #0d6efd;
          background: #eef2ff;
        }
        @media (max-width: 992px) {
          .sidebar-nav {
            display: none;
          }
          .main-content {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
