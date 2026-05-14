"use client";

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface MapLocationPickerProps {
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  showMap?: boolean;
  onChange: (data: {
    location: string;
    latitude: number | null;
    longitude: number | null;
    showMap: boolean;
  }) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export function MapLocationPicker({
  location = "",
  latitude,
  longitude,
  showMap = false,
  onChange,
}: MapLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(location);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(
    latitude && longitude
      ? { lat: latitude, lon: longitude, name: location }
      : null
  );

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setSelectedLocation({
      lat,
      lon,
      name: result.display_name,
    });
    setSearchQuery(result.display_name);
    setShowSuggestions(false);
    onChange({
      location: result.display_name,
      latitude: lat,
      longitude: lon,
      showMap: true,
    });
  };

  const handleToggleMap = (enabled: boolean) => {
    onChange({
      location: searchQuery,
      latitude: selectedLocation?.lat ?? null,
      longitude: selectedLocation?.lon ?? null,
      showMap: enabled,
    });
  };

  const mapCenter: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lon]
    : [6.5244, 3.3792]; // Default: Lagos, Nigeria

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleToggleMap(!showMap)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            showMap ? "bg-primary" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              showMap ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <Label className="cursor-pointer" onClick={() => handleToggleMap(!showMap)}>
          <MapPin className="w-4 h-4 inline mr-1" />
          Show map on event page
        </Label>
      </div>

      {showMap && (
        <div className="space-y-3">
          {/* Address Search */}
          <div className="relative">
            <Label>Search Address</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchAddress(e.target.value);
                }}
                placeholder="Start typing an address..."
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
              )}
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
                {suggestions.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Preview */}
          {selectedLocation && (
            <div className="rounded-lg overflow-hidden border" style={{ height: "250px" }}>
              <MapContainer
                center={mapCenter}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCenter} />
                <MapUpdater center={mapCenter} />
              </MapContainer>
            </div>
          )}

          {!selectedLocation && (
            <div className="flex items-center justify-center h-[200px] bg-muted rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                Search and select an address to see the map preview
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
