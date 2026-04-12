import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Search } from 'lucide-react';

// Fix for default marker icon in Leaflet + Vite
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  label: string;
  initialLat?: number;
  initialLng?: number;
}

const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
};

const ChangeView = ({ center }: { center: L.LatLngExpression }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onLocationSelect, label, initialLat, initialLng }) => {
  const [position, setPosition] = useState<L.LatLng | null>(initialLat && initialLng ? L.latLng(initialLat, initialLng) : null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const defaultCenter: L.LatLngExpression = [-18.6657, 35.5296]; // Centro de Moçambique

  useEffect(() => {
    if (position) {
      // Simplificando o reverse geocoding para o MVP (Moçambique Context)
      // Em produção, usar Nominatim ou Google Geocoding
      const mockAddress = `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`;
      if (!address) setAddress(mockAddress);
      onLocationSelect(position.lat, position.lng, address || mockAddress);
    }
  }, [position, address]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = L.latLng(pos.coords.latitude, pos.coords.longitude);
        setPosition(newPos);
        setAddress('Localização Atual (GPS)');
      });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Mozambique')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = L.latLng(parseFloat(lat), parseFloat(lon));
        setPosition(newPos);
        setAddress(display_name);
      } else {
        alert('Localização não encontrada.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow space-y-2">
          <label className="text-[10px] font-bold text-[#6D6D6D] uppercase tracking-wider">{label}</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar cidade, bairro ou rua..."
              className="premium-input pr-10"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E7D32]"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="bg-white border border-[#E0E0E0] p-3 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold h-[48px]"
        >
          <Navigation size={16} /> GPS
        </button>
      </div>

      <div className="h-[250px] rounded-2xl overflow-hidden border border-[#E0E0E0] z-0">
        <MapContainer
          center={position || defaultCenter}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker position={position} setPosition={setPosition} />
          {position && <ChangeView center={position} />}
        </MapContainer>
      </div>

      {address && (
        <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2">
          <MapPin size={16} className="text-[#2E7D32]" />
          <span className="text-[11px] font-medium text-[#2E7D32]">{address}</span>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;