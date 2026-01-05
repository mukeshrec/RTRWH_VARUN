import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import * as turf from "@turf/turf";
import {
  Calculator,
  Droplets,
  Sun,
  Mountain,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface SatelliteMapProps {
  latitude: number;
  longitude: number;
  onRoofAreaCalculated: (area: number, polygon: number[][]) => void;
  onAnalysisComplete?: (analysis: SiteAnalysis) => void;
}

export interface SiteAnalysis {
  elevation: number;
  slope: number;
  nearbyWaterBodies: Array<{ name: string; distance: number; type: string }>;
  shadowAnalysis: {
    summerShadow: string;
    winterShadow: string;
    optimalPlacement: string;
  };
  recommendations: string[];
  warnings: string[];
}

interface DrawControlProps {
  onPolygonCreated: (latlngs: L.LatLng[]) => void;
  onReset: () => void;
}

// --- Draw Control Component ---
function DrawControl({ onPolygonCreated, onReset }: DrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  // Use refs to keep callbacks stable
  const onPolygonCreatedRef = useRef(onPolygonCreated);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onPolygonCreatedRef.current = onPolygonCreated;
    onResetRef.current = onReset;
  }, [onPolygonCreated, onReset]);

  useEffect(() => {
    if (!map) return;

    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Initialize Draw Control
    const drawControlOptions = {
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          guidelineDistance: 10,
          icon: new L.DivIcon({
            iconSize: new L.Point(20, 20), // Increased size for visibility
            className: "leaflet-div-icon leaflet-editing-icon",
          }),
          shapeOptions: {
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.3,
            weight: 3,
          },
        },
        rectangle: {
          shapeOptions: {
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.3,
            weight: 3,
          },
          metric: true,
        },
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true as any,
        edit: {} as any, // ENABLED: Empty object enables the edit toolbar!
      },
    };

    const control = new (L.Control as any).Draw(drawControlOptions);
    map.addControl(control);
    drawControlRef.current = control;

    // --- Events ---

    // 1. Created (New Shape)
    const onCreated = (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers(); // Only allow one shape
      drawnItems.addLayer(layer);

      const latlngs = layer.getLatLngs()[0];
      onPolygonCreatedRef.current(latlngs);
    };

    // 2. Edited (Drags / Resizes) - THIS WAS MISSING
    const onEdited = (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const latlngs = layer.getLatLngs()[0];
        onPolygonCreatedRef.current(latlngs);
      });
    };

    // 3. Deleted
    const onDeleted = () => {
      onResetRef.current();
    };

    map.on("draw:created", onCreated);
    map.on("draw:edited", onEdited);
    map.on("draw:deleted", onDeleted);

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItems);
      map.off("draw:created", onCreated);
      map.off("draw:edited", onEdited);
      map.off("draw:deleted", onDeleted);
    };
  }, [map]);

  return null;
}

// --- Main Component ---
export default function SatelliteMap({
  latitude,
  longitude,
  onRoofAreaCalculated,
  onAnalysisComplete,
}: SatelliteMapProps) {
  const [roofPolygon, setRoofPolygon] = useState<number[][]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualArea, setManualArea] = useState("");

  const handlePolygonCreated = useCallback(
    (latlngs: L.LatLng[]) => {
      // Convert to GeoJSON [[lng, lat], ...]
      const coordinates = latlngs.map((ll) => [ll.lng, ll.lat]);
      coordinates.push(coordinates[0]); // Close loop

      const polygon = turf.polygon([coordinates]);
      const area = turf.area(polygon);

      setCalculatedArea(area);
      setRoofPolygon(coordinates);
      onRoofAreaCalculated(area, coordinates);
    },
    [onRoofAreaCalculated]
  );

  const handleReset = useCallback(() => {
    setRoofPolygon([]);
    setCalculatedArea(0);
    setSiteAnalysis(null);
    setManualArea("");
    setShowManualEntry(false);
    onRoofAreaCalculated(0, []);
  }, [onRoofAreaCalculated]);

  const handleManualAreaSubmit = () => {
    const area = parseFloat(manualArea);
    if (!isNaN(area) && area > 0) {
      setCalculatedArea(area);
      onRoofAreaCalculated(area, []);
    }
  };

  const performSiteAnalysis = async () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const mockAnalysis: SiteAnalysis = {
        elevation: 15,
        slope: 2.5,
        nearbyWaterBodies: [
          { name: "Local Lake", distance: 1200, type: "Lake" },
        ],
        shadowAnalysis: {
          summerShadow: "Minimal shadow",
          winterShadow: "Partial shadow in afternoon",
          optimalPlacement: "South-East Corner",
        },
        recommendations: [
          "Good for rooftop harvesting",
          "Gravity flow possible",
        ],
        warnings: [],
      };
      setSiteAnalysis(mockAnalysis);
      setShowAnalysis(true);
      if (onAnalysisComplete) onAnalysisComplete(mockAnalysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
      <style>{`
        .leaflet-editing-icon, .leaflet-div-icon {
          width: 20px !important;
          height: 20px !important;
          margin-left: -10px !important;
          margin-top: -10px !important;
          background-color: white !important;
          border: 3px solid #3b82f6 !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }
      `}</style>

      <MapContainer
        center={[latitude, longitude]}
        zoom={18}
        maxZoom={20}
        minZoom={3}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={19}
          maxZoom={20}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          opacity={0.7}
        />

        <Marker position={[latitude, longitude]}>
          <Popup>Target Location</Popup>
        </Marker>

        <DrawControl
          onPolygonCreated={handlePolygonCreated}
          onReset={handleReset}
        />
      </MapContainer>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-xs z-[1000]">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Roof Area
        </h3>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            {!showManualEntry ? (
              <>
                <p className="text-sm text-gray-700 mb-2">
                  Use the <b>Square</b> tool to drag a box, or <b>Polygon</b> to
                  trace. Use the <b>Edit</b> button to move/drag.
                </p>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline mt-1"
                >
                  Enter manually
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  value={manualArea}
                  onChange={(e) => setManualArea(e.target.value)}
                  placeholder="Area in m²"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleManualAreaSubmit}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {calculatedArea > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-2xl font-bold text-blue-600">
                  {calculatedArea.toFixed(2)} m²
                </p>
              </div>
            )}
          </div>

          {calculatedArea > 0 && (
            <button
              onClick={performSiteAnalysis}
              disabled={isAnalyzing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Site"}
            </button>
          )}
        </div>
      </div>

      {/* Analysis Panel */}
      <AnimatePresence>
        {showAnalysis && siteAnalysis && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl p-4 max-w-md z-[1000] max-h-[560px] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Site Analysis</h3>
              <button onClick={() => setShowAnalysis(false)}>✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <strong>Elevation:</strong> {siteAnalysis.elevation}m
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <strong>Slope:</strong> {siteAnalysis.slope}°
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong>Recs:</strong> {siteAnalysis.recommendations.join(", ")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
