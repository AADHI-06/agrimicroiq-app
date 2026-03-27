import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { useRef, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Inner component that uses useMap() to auto-fit bounds
function MapAutoFitter({ farmBoundary, zones }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Priority 1: Fit to farm boundary if provided
    if (farmBoundary) {
      try {
        const geojson = farmBoundary.geometry || farmBoundary;
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
          return;
        }
      } catch (e) {
        console.warn("Could not fit to farm boundary:", e);
      }
    }

    // Priority 2: Fit to zones if available
    if (zones && zones.length > 0) {
      try {
        const features = {
          type: "FeatureCollection",
          features: zones.map(z => ({
            type: "Feature",
            geometry: z.zone_polygon?.geometry || z.zone_polygon
          }))
        };
        const layer = L.geoJSON(features);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
        }
      } catch (e) {
        console.warn("Could not fit to zones:", e);
      }
    }
    
    // Explicitly invalidate size after any bound changes or on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // If neither available, map stays at default India center
  }, [map, farmBoundary, zones]);

  return null;
}

export default function FarmMap({ onPolygonCreated, zones = [], farmBoundary = null, farmLabel = null, height = "70vh" }) {
  const featureGroupRef = useRef(null);

  const getZoneColor = (ndvi) => {
    if (ndvi < 0.4) return '#ef4444'; // Red
    if (ndvi <= 0.7) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  // Memoize GeoJSON features to avoid unnecessary re-renders
  const geoJsonFeatures = useMemo(() => {
    if (!zones || zones.length === 0) return null;
    return {
      type: "FeatureCollection",
      features: zones.map(z => ({
        type: "Feature",
        geometry: z.zone_polygon?.geometry || z.zone_polygon,
        properties: { ndvi: z.ndvi_value, id: z.id }
      }))
    };
  }, [zones]);

  // Memoize boundary GeoJSON for rendering
  const boundaryGeoJson = useMemo(() => {
    if (!farmBoundary) return null;
    const geom = farmBoundary.geometry || farmBoundary;
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: geom,
        properties: {}
      }]
    };
  }, [farmBoundary]);

  // Stable key for zone GeoJSON layer
  const zoneKey = useMemo(() => {
    if (!zones || zones.length === 0) return 'no-zones';
    return zones.map(z => z.id).join(',');
  }, [zones]);

  // Stable key for boundary GeoJSON layer
  const boundaryKey = useMemo(() => {
    if (!farmBoundary) return 'no-boundary';
    return JSON.stringify(farmBoundary).slice(0, 100);
  }, [farmBoundary]);

  return (
    <div className="relative w-full h-full overflow-hidden group/map" style={{ borderRadius: 'var(--radius-sharp)' }}>
      {/* Editorial Farm Intel Overlay */}
      {farmLabel && (
        <div className="absolute top-8 left-8 z-[1000] animate-reveal pointer-events-none">
          <div className="editorial-card px-8 py-6 border-white/10 shadow-2xl pointer-events-auto bg-black/80 backdrop-blur-xl">
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1">
                {farmLabel.cropType || 'Satellite Intelligence'}
              </span>
              <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">{farmLabel.name}</h4>
            </div>
            
            {zones.length > 0 && (
              <div className="flex gap-10 mt-6 pt-6 border-t border-white/5">
                <div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Telemetry Nodes</span>
                  <span className="text-xl font-black text-white">{zones.length}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Operational State</span>
                  <span className="text-xl font-black text-blue-500 italic">LIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        style={{ height: '100%', width: "100%" }}
        className="z-0"
      >
        <MapAutoFitter farmBoundary={farmBoundary} zones={zones} />

        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
          opacity={0.8}
        />

        {onPolygonCreated && (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              draw={{ rectangle: false, circle: false, marker: false, polyline: false }}
              onCreated={(e) => {
                const geoJSON = e.layer.toGeoJSON();
                onPolygonCreated(geoJSON);
              }}
            />
          </FeatureGroup>
        )}

        {boundaryGeoJson && (
          <GeoJSON
            key={boundaryKey}
            data={boundaryGeoJson}
            style={() => ({
              color: '#3b82f6',
              weight: 1,
              fillOpacity: 0.05,
              fillColor: '#3b82f6',
            })}
          />
        )}

        {geoJsonFeatures && (
          <GeoJSON 
            key={zoneKey}
            data={geoJsonFeatures}
            style={(feature) => ({
              color: getZoneColor(feature.properties.ndvi),
              fillColor: getZoneColor(feature.properties.ndvi),
              fillOpacity: 0.6,
              weight: 0.5,
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}
