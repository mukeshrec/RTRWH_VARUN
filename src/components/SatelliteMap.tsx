import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { Calculator, Droplets, Sun, Mountain, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

function DrawControl({ onPolygonCreated, onReset }: DrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    if (!map) return;

    map.addLayer(drawnItemsRef.current);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            weight: 3,
          },
        },
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true,
      },
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItemsRef.current.clearLayers();
      drawnItemsRef.current.addLayer(layer);

      const latlngs = layer.getLatLngs()[0];
      onPolygonCreated(latlngs);
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const latlngs = layer.getLatLngs()[0];
        onPolygonCreated(latlngs);
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      onReset();
    });

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
    };
  }, [map, onPolygonCreated, onReset]);

  return null;
}

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
  const [manualArea, setManualArea] = useState('');

  const handlePolygonCreated = (latlngs: L.LatLng[]) => {
    const coordinates = latlngs.map((ll) => [ll.lng, ll.lat]);
    coordinates.push(coordinates[0]);

    const polygon = turf.polygon([coordinates]);
    const area = turf.area(polygon);

    setCalculatedArea(area);
    setRoofPolygon(coordinates);
    onRoofAreaCalculated(area, coordinates);
  };

  const handleReset = () => {
    setRoofPolygon([]);
    setCalculatedArea(0);
    setSiteAnalysis(null);
    setManualArea('');
    setShowManualEntry(false);
    onRoofAreaCalculated(0, []);
  };

  const handleManualAreaSubmit = () => {
    const area = parseFloat(manualArea);
    if (!isNaN(area) && area > 0) {
      setCalculatedArea(area);
      onRoofAreaCalculated(area, []);
    }
  };

  const performSiteAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      const elevationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      const elevationData = await elevationResponse.json();

      const waterBodiesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/water-bodies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude, radius: 5000 }),
        }
      );

      const waterBodiesData = await waterBodiesResponse.json();

      const shadowAnalysis = analyzeShadowPatterns(latitude, longitude);

      const recommendations = generateRecommendations(
        elevationData,
        waterBodiesData,
        shadowAnalysis
      );

      const warnings = generateWarnings(elevationData, waterBodiesData);

      const analysis: SiteAnalysis = {
        elevation: elevationData.elevation || 0,
        slope: elevationData.slope || 0,
        nearbyWaterBodies: waterBodiesData.waterBodies || [],
        shadowAnalysis,
        recommendations,
        warnings,
      };

      setSiteAnalysis(analysis);
      setShowAnalysis(true);

      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (error) {
      console.error('Site analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeShadowPatterns = (lat: number, lng: number) => {
    const SunCalc = require('suncalc');

    const summerSolstice = new Date(new Date().getFullYear(), 5, 21, 12, 0, 0);
    const winterSolstice = new Date(new Date().getFullYear(), 11, 21, 12, 0, 0);

    const summerPos = SunCalc.getPosition(summerSolstice, lat, lng);
    const winterPos = SunCalc.getPosition(winterSolstice, lat, lng);

    const summerAltitude = (summerPos.altitude * 180) / Math.PI;
    const winterAltitude = (winterPos.altitude * 180) / Math.PI;

    let summerShadow = 'Minimal shadow coverage during peak summer';
    let winterShadow = 'Moderate shadow coverage during winter months';
    let optimalPlacement = 'South-facing areas receive maximum sunlight year-round';

    if (lat < 0) {
      optimalPlacement = 'North-facing areas receive maximum sunlight year-round';
    }

    return {
      summerShadow,
      winterShadow,
      optimalPlacement,
    };
  };

  const generateRecommendations = (
    elevation: any,
    waterBodies: any,
    shadow: any
  ): string[] => {
    const recommendations: string[] = [];

    if (elevation.elevation > 0) {
      recommendations.push(
        `Site elevation is ${Math.round(elevation.elevation)}m - gravity-fed systems are feasible`
      );
    }

    if (waterBodies.waterBodies && waterBodies.waterBodies.length > 0) {
      const nearest = waterBodies.waterBodies[0];
      recommendations.push(
        `Nearest water body (${nearest.name}) is ${Math.round(nearest.distance)}m away - consider as backup source`
      );
    }

    recommendations.push(shadow.optimalPlacement);

    if (elevation.slope < 5) {
      recommendations.push(
        'Flat terrain - ideal for underground storage tanks and recharge pits'
      );
    } else if (elevation.slope < 15) {
      recommendations.push(
        'Moderate slope - consider terraced recharge structures for better infiltration'
      );
    }

    return recommendations;
  };

  const generateWarnings = (elevation: any, waterBodies: any): string[] => {
    const warnings: string[] = [];

    if (elevation.slope > 20) {
      warnings.push(
        'Steep slope detected - additional structural support may be required for tanks'
      );
    }

    if (waterBodies.waterBodies && waterBodies.waterBodies.length === 0) {
      warnings.push(
        'No nearby water bodies detected - rainwater harvesting is crucial for water security'
      );
    }

    if (elevation.elevation < 10) {
      warnings.push(
        'Low-lying area - assess flood risk before installing ground-level structures'
      );
    }

    return warnings;
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
      <MapContainer
        center={[latitude, longitude]}
        zoom={18}
        maxZoom={20}
        minZoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Satellite: Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={19}
          maxZoom={20}
        />

        <TileLayer
          attribution='Labels'
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          opacity={0.7}
          maxNativeZoom={19}
          maxZoom={20}
        />

        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">Your Location</p>
              <p className="text-sm text-gray-600">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>

        <DrawControl onPolygonCreated={handlePolygonCreated} onReset={handleReset} />
      </MapContainer>

      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-xs z-[1000]">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Roof Area Measurement
        </h3>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            {!showManualEntry ? (
              <>
                <p className="text-sm text-gray-700 mb-2">
                  Use the polygon tool (square icon) on the right to trace your roof outline.
                </p>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline mt-1"
                >
                  Or enter roof area manually
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 mb-2">
                  Enter your roof area manually:
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                    placeholder="e.g., 150"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="flex items-center text-sm text-gray-600">m²</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualAreaSubmit}
                    disabled={!manualArea || parseFloat(manualArea) <= 0}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualArea('');
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {calculatedArea > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-3 border-t border-blue-200"
              >
                <p className="text-xs text-gray-600 mb-1">
                  {roofPolygon.length > 0 ? 'Measured' : 'Entered'} Roof Area:
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {calculatedArea.toFixed(2)} m²
                </p>
              </motion.div>
            )}
          </div>

          {calculatedArea > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={performSiteAnalysis}
              disabled={isAnalyzing}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Mountain className="w-4 h-4" />
                  Analyze Site
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAnalysis && siteAnalysis && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl p-4 max-w-md z-[1000] max-h-[560px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-600" />
                Site Analysis
              </h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Elevation</p>
                    <p className="text-lg font-bold text-gray-800 flex items-center gap-1">
                      <Mountain className="w-4 h-4 text-blue-600" />
                      {Math.round(siteAnalysis.elevation)}m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Slope</p>
                    <p className="text-lg font-bold text-gray-800">
                      {siteAnalysis.slope.toFixed(1)}°
                    </p>
                  </div>
                </div>
              </div>

              {siteAnalysis.nearbyWaterBodies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Nearby Water Bodies
                  </h4>
                  <div className="space-y-2">
                    {siteAnalysis.nearbyWaterBodies.slice(0, 3).map((wb, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50 rounded-lg p-2 text-sm"
                      >
                        <p className="font-medium text-gray-800">{wb.name}</p>
                        <p className="text-xs text-gray-600">
                          {Math.round(wb.distance)}m away • {wb.type}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-600" />
                  Shadow Analysis
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-yellow-50 rounded-lg p-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Summer:</span>{' '}
                      {siteAnalysis.shadowAnalysis.summerShadow}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Winter:</span>{' '}
                      {siteAnalysis.shadowAnalysis.winterShadow}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Optimal:</span>{' '}
                      {siteAnalysis.shadowAnalysis.optimalPlacement}
                    </p>
                  </div>
                </div>
              </div>

              {siteAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {siteAnalysis.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="bg-green-50 rounded-lg p-2 text-sm text-gray-700 flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {siteAnalysis.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Warnings
                  </h4>
                  <ul className="space-y-2">
                    {siteAnalysis.warnings.map((warn, idx) => (
                      <li
                        key={idx}
                        className="bg-orange-50 rounded-lg p-2 text-sm text-gray-700 flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
