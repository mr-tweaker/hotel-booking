// assets/app.js
// API Base URL - automatically detects environment
const API_BASE = (() => {
  // Local development - always use backend server on port 4000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '5500') {
    return 'http://localhost:4000/api';
  }
  // Production/Vercel - use current origin
  return window.location.origin + '/api';
})();

// helper: simple toast
function toast(m){ alert(m); }

// ---------- Analytics Tracking ----------
function trackEvent(type, payload = {}) {
  // Analytics tracking - fail silently, don't block user actions
  try {
    fetch(API_BASE + '/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, ts: new Date().toISOString() })
    }).catch(err => {
      // Silently fail - analytics shouldn't block user actions
      console.warn('Analytics tracking failed (non-critical):', err);
    });
  } catch (err) {
    // Silently fail - analytics shouldn't block user actions
    console.warn('Analytics tracking failed (non-critical):', err);
  }
}

// Track page views
if (location.pathname.endsWith('index.html') || location.pathname === '/') {
  trackEvent('visit_home');
} else if (location.pathname.endsWith('search.html')) {
  trackEvent('visit_search');
} else if (location.pathname.endsWith('hotel.html')) {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  trackEvent('hotel_open', { hotelId: id });
}

// ---------- Auth UI / Nav ----------
function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem('currentUser')); }catch(e){ return null; } }
function setCurrentUser(u){ localStorage.setItem('currentUser', JSON.stringify(u)); }
function logout(){ localStorage.removeItem('currentUser'); location.href='index.html'; }

function renderNavAuth(targetId){
  const root = document.getElementById(targetId || 'navAuthPlaceholder');
  const user = getCurrentUser();
  if(!root) return;
  if(user){
    root.innerHTML = `
      <div class="dropdown">
        <a class="d-flex align-items-center text-decoration-none dropdown-toggle" href="#" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <div style="width:36px;height:36px;border-radius:50%;background:#e6f0ff;color:#0d47a1;display:flex;align-items:center;justify-content:center;font-weight:700;margin-right:8px;">
            ${user.name?user.name[0].toUpperCase():'U'}
          </div>
          <div class="me-2">
            <div style="font-weight:600">${user.name||user.email||user.phone}</div>
            <small class="text-muted">View profile</small>
          </div>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
          <li><a class="dropdown-item" href="#">Profile</a></li>
          <li><a class="dropdown-item" href="#">Bookings</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutLink">Logout</a></li>
        </ul>
      </div>`;
    // attach logout
    setTimeout(()=>{ const l = document.getElementById('logoutLink'); if(l) l.addEventListener('click', ()=>{ logout(); }); }, 100);
  } else {
    root.innerHTML = `<a class="btn btn-outline-primary me-2" href="login.html">Login</a><a class="btn btn-primary" href="signup.html">Sign up</a>`;
  }
}

// initial render for header(s)
renderNavAuth('navAuthPlaceholder');
renderNavAuth('navRightHotel');

// ---------- Signup ----------
if(location.pathname.endsWith('signup.html')){
  document.getElementById('signupForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try{
      const res = await fetch(API_BASE + '/auth/signup', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
      });
      if(res.ok){ 
        trackEvent('signup', { email: data.email });
        
        // Store signup data for pre-filling property form
        sessionStorage.setItem('signupData', JSON.stringify(data));
        sessionStorage.setItem('justSignedUp', 'true');
        
        toast('Signup successful! Redirecting to property listing...'); 
        // Redirect to list property page after successful signup
        setTimeout(() => {
          location.href='list-property.html?from=signup'; 
        }, 1000);
      }
      else { 
        trackEvent('signup_fail', { email: data.email });
        const js = await res.json(); 
        toast(js.error || js.message || 'Signup failed'); 
      }
    }catch(err){ toast('Network error'); }
  });
}

// ---------- Login ----------
if(location.pathname.endsWith('login.html')){
  document.getElementById('loginForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    // backend expected body { user, pass } per older code; we support both shapes
    const payload = { user: data.user, pass: data.pass };
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      const js = await res.json();
      if(res.ok && js.user){
        trackEvent('login_success', { email: js.user.email });
        setCurrentUser(js.user);
        toast('Login successful');
        location.href = 'dashboard-manager.html';
      } else {
        trackEvent('login_fail', { user: data.user });
        toast(js.error || js.message || 'Invalid credentials');
      }
    } catch (err) { toast('Network error'); }
  });
}

// ---------- Demo hotels dataset (includes NatureOnTheRocks) ----------
const HOTELS = [
  { id:'H1001', name:'Connaught Place Comfort', locality:'Connaught Place', price:799, stars:4, amenities:['Wifi','Parking'] },
  { id:'H1002', name:'Saket Suites', locality:'Saket', price:599, stars:3, amenities:['Wifi','Pool'] },
  { id:'H1003', name:'Hauz Khas Inn', locality:'Hauz Khas', price:499, stars:2, amenities:['Wifi'] },
  { id:'H1004', name:'Dwarka Deluxe', locality:'Dwarka', price:999, stars:5, amenities:['Wifi','Parking','Pool'] },
  // new hotel — Nature on the Rocks
  { id:'NTR001', name:'Nature on the Rocks', locality:'Rishikesh', price:1299, stars:4, amenities:['Wifi','Parking','Bathtub'], images: [
    'assets/images/natureontherocks/nature1.jpg',
    'assets/images/natureontherocks/nature2.jpg',
    'assets/images/natureontherocks/nature3.jpg',
    'assets/images/natureontherocks/nature4.jpg'
  ], description: 'Cliffside property in Rishikesh — great views and relaxing dining patio.' }
];

// ---------- Index / search page ----------
if(location.pathname.endsWith('index.html') || location.pathname === '/' ){
  const renderCards = (list)=>{
    const out = document.getElementById('resultsGrid');
    out.innerHTML = '';
    list.forEach(h=>{
      const el = document.createElement('div');
      el.className = 'col-md-6 col-lg-4';
      el.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${h.images ? h.images[0] : 'https://source.unsplash.com/800x600/?hotel,room,'+encodeURIComponent(h.locality)}" class="card-img-top" style="height:200px; object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="card-title mb-0">${h.name}</h5>
                <small class="text-muted">${h.locality} • ${h.stars}★</small>
              </div>
              <div class="text-end">
                <div class="h5 fw-bold">₹${h.price}</div>
                <small class="text-muted">per hour</small>
              </div>
            </div>
            <p class="card-text small text-muted mb-3">${h.description || 'Comfortable rooms, clean & sanitized — ideal for short stays.'}</p>
            <div class="mt-auto d-flex gap-2">
              <a class="btn btn-outline-primary btn-sm w-100" href="hotel.html?id=${h.id}">View</a>
              <a class="btn btn-primary btn-sm w-100" href="hotel.html?id=${h.id}">Book</a>
            </div>
          </div>
        </div>`;
      out.appendChild(el);
    });
  };

  renderCards(HOTELS);

  // search
  document.getElementById('quickSearch')?.addEventListener('submit', function(e){
    e.preventDefault();
    const locality = document.getElementById('searchLocality').value;
    let list = HOTELS.filter(h => locality === 'All' || h.locality === locality);
    renderCards(list);
  });

  document.getElementById('applyFilterBtn')?.addEventListener('click', ()=>{
    const maxPrice = +document.getElementById('priceRange').value;
    const stars = document.getElementById('filterStars').value;
    const locality = document.getElementById('filterLocality').value;
    const amenities = Array.from(document.querySelectorAll('.amen:checked')).map(i=>i.value);
    let list = HOTELS.filter(h => h.price <= maxPrice);
    if(stars !== 'any') list = list.filter(h => h.stars === +stars);
    if(locality && locality !== 'All') list = list.filter(h => h.locality === locality);
    if(amenities.length) list = list.filter(h => amenities.every(a => (h.amenities||[]).includes(a)));
    renderCards(list);
  });
}

// ---------- Hotel details + rooms + booking ----------
if(location.pathname.endsWith('hotel.html')){
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'H1001';
  const hotel = HOTELS.find(h => h.id === id) || HOTELS[0];

  // populate
  document.getElementById('hotelTitle').textContent = hotel.name;
  document.getElementById('hotelLocation').textContent = hotel.locality;
  document.getElementById('hotelPrice').textContent = hotel.price;
  document.getElementById('hotelDesc').textContent = hotel.description || '';
  document.getElementById('hotelAmenities').innerHTML = (hotel.amenities || []).map(a=>`<span class="badge-amen">${a}</span>`).join(' ');
  const mainImg = document.getElementById('hotelMainImg');
  const thumbs = document.getElementById('thumbnailRow');
  if(hotel.images && hotel.images.length){
    mainImg.src = hotel.images[0];
    thumbs.innerHTML = hotel.images.map((p,i)=>`<img src="${p}" style="height:70px; width:110px; object-fit:cover; cursor:pointer; border-radius:6px;" onclick="document.getElementById('hotelMainImg').src='${p}'">`).join(' ');
  }

  // Demo rooms (for the hotel's room selection)
  const demoRooms = [
    { roomNumber:'101', type:'Single', price: hotel.price, bed:'Single Bed', avail:true },
    { roomNumber:'102', type:'Deluxe', price: hotel.price + 300, bed:'Double Bed', avail:true },
    { roomNumber:'103', type:'Suite', price: hotel.price + 800, bed:'Double + Sofa', avail:false }, // booked for example
  ];

  document.getElementById('openRoomsBtn').addEventListener('click', ()=>{
    const section = document.getElementById('roomsSection');
    const list = document.getElementById('roomsList');
    list.innerHTML = '';
    demoRooms.forEach(r=>{
      list.insertAdjacentHTML('beforeend',
        `<div class="col-md-6">
          <div class="card p-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="fw-bold">${r.type} • ${r.bed}</div>
                <div class="small text-muted">Room ${r.roomNumber}</div>
              </div>
              <div class="text-end">
                <div class="h5 fw-bold">₹${r.price}</div>
                <small class="${r.avail ? 'text-success' : 'text-muted'}">${r.avail ? 'Available' : 'Booked'}</small>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-sm ${r.avail ? 'btn-primary' : 'btn-outline-secondary'}" ${r.avail ? '' : 'disabled'} onclick='selectRoom("${r.roomNumber}", "${r.type}", ${r.price})'>Select</button>
              <button class="btn btn-sm btn-outline-dark" onclick='viewRoomDetails("${r.roomNumber}")'>Details</button>
            </div>
          </div>
        </div>`);
    });
    section.style.display = 'block';
    window.scrollTo({ top: section.offsetTop-20, behavior:'smooth' });
  });

  window.selectRoom = function(roomNumber, roomType, price){
    document.getElementById('selectedRoomInput').value = `${roomNumber} — ${roomType} — ₹${price}`;
    // attach booking modal with selected room info
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    bookingModal.show();
    // store selected in global so booking submit knows it
    window._selectedRoom = { roomNumber, roomType, price };
  };

  window.viewRoomDetails = function(rn){ alert('Room ' + rn + ' — more details can go here'); };

  // booking submit handler
  document.getElementById('bookingForm').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const user = getCurrentUser();
    if(!user){
      // require login
      toast('Please login or sign up to complete booking. Redirecting to login.');
      location.href = 'login.html';
      return;
    }

    // Track payment page opened
    trackEvent('payment_page_opened', { hotelId: hotel.id });

    const booking = {
      bookingId: 'BK' + Date.now(),
      hotelId: hotel.id,
      hotelName: hotel.name,
      userEmail: user.email || '',
      userName: user.name || user.phone || '',
      name: document.getElementById('gName').value,
      phone: document.getElementById('gPhone').value,
      roomNumber: window._selectedRoom ? window._selectedRoom.roomNumber : '',
      roomType: window._selectedRoom ? window._selectedRoom.roomType : '',
      price: window._selectedRoom ? window._selectedRoom.price : hotel.price,
      checkin: document.getElementById('gCheckin').value,
      checkout: document.getElementById('gCheckout').value,
      paymentMethod: document.getElementById('payMethod').value,
      numberOfGuests: document.getElementById('gGuests') ? document.getElementById('gGuests').value : 1,
      paymentStatus: 'pending',
      guests: [document.getElementById('gName').value],
      documents: []
    };

    // if user selected a payment method that is immediate, simulate paid
    if(booking.paymentMethod === 'upi' || booking.paymentMethod === 'card' || booking.paymentMethod === 'wallet'){
      booking.paymentStatus = 'paid';
    } else {
      booking.paymentStatus = 'pending';
    }

    // Track booking attempt
    trackEvent('booking_attempt', { hotelId: hotel.id, paymentMethod: booking.paymentMethod });

    // prepare formdata and append files
    const fd = new FormData();
    fd.append('booking', JSON.stringify(booking));
    const files = document.getElementById('gIDs').files;
    for(let i=0;i<files.length && i<3;i++) fd.append('idProofs', files[i]);

    try {
      const res = await fetch(API_BASE + '/booking', { method:'POST', body: fd });
      if(res.ok){
        const result = await res.json();
        trackEvent('booking_completed', { bookingId: booking.bookingId, hotelId: hotel.id, paymentStatus: booking.paymentStatus });
        toast('Booking confirmed — ' + booking.paymentStatus);
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        // optional: redirect to booking confirmation or bookings page
        location.href = 'index.html';
      } else {
        trackEvent('booking_failed', { hotelId: hotel.id });
        const txt = await res.text();
        toast('Booking failed: ' + txt);
      }
    } catch(err){
      console.error(err);
      trackEvent('booking_failed', { hotelId: hotel.id, error: 'network' });
      toast('Network error while booking');
    }
  });
}

// Re-render nav (hotel page uses different nav container)
renderNavAuth('navRightHotel');
renderNavAuth('navAuthPlaceholder');
