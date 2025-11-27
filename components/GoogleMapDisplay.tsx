'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapDisplayProps {
  lat: number;
  lng: number;
  height?: string;
  zoom?: number;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMapDisplay({
  lat,
  lng,
  height = '300px',
  zoom = 15,
}: GoogleMapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps script
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      document.head.appendChild(script);

      return () => {
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript);
        }
      };
    } else if (window.google) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Add marker
      new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: 'Property Location',
      });
    }
  }, [isLoaded, lat, lng, zoom]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height,
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      />
      {!isLoaded && (
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
    </div>
  );
}








