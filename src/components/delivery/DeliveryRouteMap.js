'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Crosshair,
  AlertCircle,
} from 'lucide-react';
import { loadGoogleMapsScript } from '@/lib/googleMapsLoader';
import { formatPrice } from '@/lib/utils';

export default function DeliveryRouteMap({
  orders = [],
  storeCenter = { lat: 18.8256, lng: 78.9135 },
  selectedOrderId = null,
  onSelectOrder = null,
  onUpdateStatus = null,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const warehouseMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Keep internal activeOrder in sync with prop
  useEffect(() => {
    if (selectedOrderId) {
      const match = orders.find((o) => (o._id || o.id) === selectedOrderId);
      if (match) setActiveOrder(match);
    }
  }, [selectedOrderId, orders]);

  // Geocode address fallback if lat/lng is missing
  const getOrderCoords = (order) => {
    const addr = order.deliveryAddress;
    if (addr && addr.lat && addr.lng) {
      const lat = parseFloat(addr.lat);
      const lng = parseFloat(addr.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript()
      .then((googleMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const defaultCenter = storeCenter?.lat && storeCenter?.lng ? storeCenter : { lat: 18.8256, lng: 78.9135 };

        const map = new googleMaps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapRef.current = map;

        // Warehouse Marker (Store Hub)
        const warehouseSvg = `
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#0C831F" stroke="#ffffff" stroke-width="3"/>
            <path d="M13 18L20 12L27 18V28H13V18Z" fill="white"/>
            <rect x="17" y="21" width="6" height="7" fill="#0C831F"/>
          </svg>
        `;

        const warehouseMarker = new googleMaps.Marker({
          position: defaultCenter,
          map,
          title: 'Jyothi Mart Warehouse Hub',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(warehouseSvg),
            scaledSize: new googleMaps.Size(40, 40),
            anchor: new googleMaps.Point(20, 20),
          },
          zIndex: 10,
        });

        const warehouseInfoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 6px 8px;">
              <strong style="color: #0C831F; font-size: 13px;">🏪 Jyothi Mart Hub</strong>
              <p style="margin: 2px 0 0; font-size: 11px; color: #555;">Dispatch & Pickup Center</p>
            </div>
          `,
        });

        warehouseMarker.addListener('click', () => {
          warehouseInfoWindow.open(map, warehouseMarker);
        });

        warehouseMarkerRef.current = warehouseMarker;
        setMapLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load Google Maps for Delivery:', err);
        setMapError(err.message || 'Could not load map');
      });

    return () => {
      isMounted = false;
    };
  }, [storeCenter]);

  // Update Markers when orders change or map initializes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps) return;

    const googleMaps = window.google.maps;
    const map = mapRef.current;

    // Clear existing order markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new googleMaps.LatLngBounds();
    let hasCoords = false;

    // Add store to bounds
    if (storeCenter?.lat && storeCenter?.lng) {
      bounds.extend(new googleMaps.LatLng(storeCenter.lat, storeCenter.lng));
      hasCoords = true;
    }

    orders.forEach((order, index) => {
      const coords = getOrderCoords(order);
      if (!coords) return;

      const orderId = order._id || order.id;
      const isSelected = activeOrder && (activeOrder._id === orderId || activeOrder.id === orderId);
      const isOutForDelivery = order.status === 'out_for_delivery';

      // Pin Color: Purple for out_for_delivery, Blue for confirmed/packing
      const pinColor = isOutForDelivery ? '#7C3AED' : '#2563EB';
      const labelNumber = `${index + 1}`;

      const pinSvg = `
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="17" cy="16" r="10" fill="#ffffff"/>
          <text x="17" y="20" font-size="11" font-weight="bold" fill="${pinColor}" text-anchor="middle" font-family="sans-serif">${labelNumber}</text>
        </svg>
      `;

      const marker = new googleMaps.Marker({
        position: coords,
        map,
        title: `Order #${order.orderNumber || orderId.slice(-6).toUpperCase()}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg),
          scaledSize: new googleMaps.Size(34, 42),
          anchor: new googleMaps.Point(17, 42),
        },
        zIndex: isSelected ? 50 : 20,
      });

      marker.addListener('click', () => {
        setActiveOrder(order);
        if (onSelectOrder) onSelectOrder(order);
        map.panTo(coords);
      });

      markersRef.current.push(marker);
      bounds.extend(new googleMaps.LatLng(coords.lat, coords.lng));
      hasCoords = true;
    });

    if (hasCoords && markersRef.current.length > 0) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 80, left: 40 });
    }
  }, [mapLoaded, orders, activeOrder, onSelectOrder, storeCenter]);

  // Center on Driver's GPS Location
  const locateDriver = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const currentLoc = { lat: latitude, lng: longitude };
        setDriverLocation(currentLoc);

        if (mapRef.current && window.google?.maps) {
          mapRef.current.panTo(currentLoc);
          mapRef.current.setZoom(16);

          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition(currentLoc);
          } else {
            const driverSvg = `
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#0284C7" fill-opacity="0.25"/>
                <circle cx="16" cy="16" r="8" fill="#0284C7" stroke="#ffffff" stroke-width="2.5"/>
              </svg>
            `;

            driverMarkerRef.current = new window.google.maps.Marker({
              position: currentLoc,
              map: mapRef.current,
              title: 'Your Current Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(driverSvg),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16),
              },
              zIndex: 100,
            });
          }
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert('Could not determine your GPS location. Please check device location permissions.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const getNavigationUrl = (order) => {
    if (!order) return '#';
    const coords = getOrderCoords(order);
    if (coords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    }
    const addr = order.deliveryAddress;
    const str = typeof addr === 'string' ? addr : addr?.fullAddress || addr?.addressLine1 || '';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(str)}`;
  };

  if (mapError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h4 className="text-sm font-bold text-gray-800">Map Loading Unavailable</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          {mapError}. You can still navigate directly using the external Google Maps navigation links on each order card.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[400px] sm:h-[480px] bg-gray-100"
      />

      {/* Loading Skeleton */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center space-y-2.5 z-10">
          <div className="w-10 h-10 border-3 border-[#0C831F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-600">Loading delivery route map...</p>
        </div>
      )}

      {/* Floating GPS 'Locate Me' Button */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={locateDriver}
          disabled={locating}
          className="p-2.5 bg-white/95 backdrop-blur-xs text-gray-700 hover:text-[#0C831F] rounded-xl shadow-md border border-gray-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Find my current location"
        >
          <Crosshair className={`w-5 h-5 ${locating ? 'animate-spin text-[#0C831F]' : ''}`} />
        </button>
      </div>

      {/* Route Map Legend */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-[11px] font-bold text-gray-700 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0C831F]" /> Hub
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Out for Delivery
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Ready
        </span>
      </div>

      {/* Selected Order Bottom Preview Card */}
      {activeOrder && (
        <div className="p-3.5 bg-white border-t border-gray-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-gray-900">
                #{activeOrder.orderNumber || (activeOrder._id || activeOrder.id || '').slice(-6).toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-gray-800">
                {formatPrice(activeOrder.grandTotal || 0)}
              </span>
            </div>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                activeOrder.status === 'out_for_delivery'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {activeOrder.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0C831F] flex-shrink-0" />
              <p className="truncate">
                {typeof activeOrder.deliveryAddress === 'string'
                  ? activeOrder.deliveryAddress
                  : activeOrder.deliveryAddress?.fullAddress || activeOrder.deliveryAddress?.addressLine1 || 'Address on file'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={getNavigationUrl(activeOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-xl text-xs font-bold transition active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Navigation</span>
            </a>

            {activeOrder.customerPhone && (
              <a
                href={`tel:${activeOrder.customerPhone}`}
                className="flex items-center justify-center gap-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-gray-600" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
