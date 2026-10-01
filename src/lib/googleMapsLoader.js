'use client';

let googleMapsPromise = null;

export function loadGoogleMapsScript(apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, timeoutMs = 5000) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));
  
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  const key = apiKey || 'AIzaSyCoTlnSpjVx1nAv70I_SWmPN0T5zCusb68';

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          googleMapsPromise = null;
          reject(new Error(`Google Maps loading timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      const existing = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existing) {
        existing.addEventListener('load', () => {
          cleanup();
          resolve(window.google?.maps || window.google);
        });
        existing.addEventListener('error', (e) => {
          cleanup();
          googleMapsPromise = null;
          reject(e);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places,geometry&loading=async';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        cleanup();
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          googleMapsPromise = null;
          reject(new Error('Google Maps script loaded but window.google.maps not found'));
        }
      };
      script.onerror = () => {
        cleanup();
        googleMapsPromise = null;
        reject(new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
