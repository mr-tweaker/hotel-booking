'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  height = '400px',
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.');
      return;
    }

    // Load Google Maps script
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          setError(null);
        } else {
          setError('Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled.');
        }
      };
      script.onerror = () => {
        setError('Failed to load Google Maps script. Please check your internet connection and API key.');
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript);
        }
      };
    } else if (window.google) {
      setIsLoaded(true);
    }
  }, []);

  // Initialize map only once when loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && window.google && window.google.maps && !map) {
      try {
        const defaultCenter = selectedLocation
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : { lat: 28.6139, lng: 77.209 }; // Default to Delhi

        const newMap = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: selectedLocation ? 15 : 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        setMap(newMap);

        // Initialize Places Autocomplete
        if (searchInputRef.current && window.google.maps.places) {
          const autocompleteInstance = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              types: ['establishment', 'geocode'],
              componentRestrictions: { country: 'in' }, // Restrict to India
            }
          );

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry && place.geometry.location) {
              const position = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
              setSelectedLocation(position);
              onLocationSelect(position.lat, position.lng);
              
              // Center map on selected place
              newMap.setCenter(position);
              newMap.setZoom(15);

              // Update or create marker
              if (marker) {
                marker.setPosition(position);
              } else {
                const newMarker = new window.google.maps.Marker({
                  position,
                  map: newMap,
                  draggable: true,
                  title: place.name || 'Property Location',
                });
                setMarker(newMarker);

                newMarker.addListener('dragend', (e: any) => {
                  const pos = e.latLng.toJSON();
                  setSelectedLocation(pos);
                  onLocationSelect(pos.lat, pos.lng);
                });
              }
            }
          });

          setAutocomplete(autocompleteInstance);
        }

        // Add marker if initial location is provided
        if (selectedLocation) {
          const newMarker = new window.google.maps.Marker({
            position: selectedLocation,
            map: newMap,
            draggable: true,
            title: 'Property Location',
          });
          setMarker(newMarker);

          // Update location when marker is dragged
          newMarker.addListener('dragend', (e: any) => {
            const position = e.latLng.toJSON();
            setSelectedLocation(position);
            onLocationSelect(position.lat, position.lng);
          });
        }

        // Add click listener to map
        newMap.addListener('click', (e: any) => {
          const position = e.latLng.toJSON();
          setSelectedLocation(position);
          onLocationSelect(position.lat, position.lng);

          // Update or create marker
          if (marker) {
            marker.setPosition(position);
          } else {
            const newMarker = new window.google.maps.Marker({
              position,
              map: newMap,
              draggable: true,
              title: 'Property Location',
            });
            setMarker(newMarker);

            // Update location when marker is dragged
            newMarker.addListener('dragend', (e: any) => {
              const position = e.latLng.toJSON();
              setSelectedLocation(position);
              onLocationSelect(position.lat, position.lng);
            });
          }
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize Google Maps. Please check your API key and try again.');
      }
    }
  }, [isLoaded, map]);

  // Update marker when initial location changes
  useEffect(() => {
    if (map && marker && initialLat && initialLng) {
      const position = { lat: initialLat, lng: initialLng };
      marker.setPosition(position);
      map.setCenter(position);
      map.setZoom(15);
    }
  }, [initialLat, initialLng, map, marker]);

  if (error) {
    return (
      <div className="alert alert-warning">
        <strong>⚠️ Google Maps Error:</strong>
        <p className="mb-0 mt-2">{error}</p>
        <p className="mb-0 mt-2 small">
          To fix this:
          <ol className="mt-2 mb-0">
            <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Enable "Maps JavaScript API" and "Places API"</li>
            <li>Add to your <code>.env.local</code> file: <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</code></li>
            <li>Restart your development server</li>
          </ol>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Input */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Search for Location</label>
        <input
          ref={searchInputRef}
          type="text"
          className="form-control"
          placeholder="Type to search for your property location (e.g., hotel name, address, landmark)"
          disabled={!isLoaded}
        />
        <small className="text-muted">Start typing to search for your property location</small>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height,
          borderRadius: '8px',
          border: '1px solid #ddd',
          display: isLoaded ? 'block' : 'none',
        }}
      />
      
      {selectedLocation && (
        <div className="mt-2 alert alert-success">
          <strong>✓ Location Selected:</strong> Latitude: {selectedLocation.lat.toFixed(6)}, Longitude: {selectedLocation.lng.toFixed(6)}
        </div>
      )}
      
      {!isLoaded && !error && (
        <div
          style={{
            width: '100%',
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
            <p className="mt-2 text-muted">Loading Google Maps...</p>
          </div>
        </div>
      )}
      
      <div className="mt-2 small text-muted">
        <strong>Tip:</strong> You can search for your location above, click on the map, or drag the marker to set your property's exact location.
      </div>
    </div>
  );
}

