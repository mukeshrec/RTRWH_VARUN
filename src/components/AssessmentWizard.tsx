import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  User,
  Home,
  Users,
  Cloud,
  CheckCircle,
  MapPin,
  Loader,
  Satellite,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectInput } from "../lib/calculations";
import SatelliteMap, { SiteAnalysis } from "./SatelliteMap";

interface AssessmentWizardProps {
  onComplete: (
    data: ProjectInput & {
      userName: string;
      userContact: string;
      locationName: string;
      currentWaterSources?: string;
      roofPolygon?: number[][];
      siteAnalysis?: SiteAnalysis;
    }
  ) => void;
}

export default function AssessmentWizard({
  onComplete,
}: AssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [roofPolygon, setRoofPolygon] = useState<number[][]>([]);
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);
  const [userLatitude, setUserLatitude] = useState<number | null>(null);
  const [userLongitude, setUserLongitude] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    userName: "",
    userContact: "",
    locationName: "",
    roofArea: "",
    roofType: "Concrete" as const,
    roofHeight: "3",
    householdSize: "",
    availableSpace: "",
    waterScarcityDays: "",
    currentWaterSources: "",
    annualRainfall: "",
    rainfallIntensity: "100",
    aquiferType: "Unconsolidated" as const,
    depthWaterPremonsoon: "",
    depthWaterPostmonsoon: "",
    soilType: "",
    infiltrationRate: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getAquiferTypeByState = (
    state: string
  ): "Unconsolidated" | "Semi-consolidated" | "Consolidated" => {
    const stateUpper = state.toUpperCase();

    if (stateUpper.includes("TAMIL NADU")) {
      return "Consolidated";
    } else if (
      stateUpper.includes("PUNJAB") ||
      stateUpper.includes("HARYANA") ||
      stateUpper.includes("UTTAR PRADESH") ||
      stateUpper.includes("BIHAR")
    ) {
      return "Unconsolidated";
    } else if (stateUpper.includes("KERALA") || stateUpper.includes("GOA")) {
      return "Semi-consolidated";
    }

    return "Unconsolidated";
  };

  // Auto-detect location when component mounts
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    console.log("Starting location detection...");
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser";
      console.error(errorMsg);
      alert(errorMsg);
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap's Nominatim service for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );

          if (!response.ok) {
            throw new Error("Failed to get location details");
          }

          const locationData = await response.json();
          console.log("Location data:", locationData);

          // Extract location details
          const address = locationData.address || {};
          const city = address.city || address.town || address.village || "";
          const state = address.state || "";
          const displayLocation =
            [city, state].filter(Boolean).join(", ") || "Unknown location";

          console.log("Location detected - State:", state);
          console.log("Location data:", locationData);

          setUserLatitude(latitude);
          setUserLongitude(longitude);
          updateField("locationName", displayLocation);

          if (state) {
            const aquiferType = getAquiferTypeByState(state);
            console.log("Aquifer type determined:", aquiferType);
            updateField("aquiferType", aquiferType);
            console.log("Form data after aquifer update:", formData);
          } else {
            console.warn("No state detected from location data");
          }

          const currentYear = new Date().getFullYear();
          const previousYear = currentYear - 1;
          const rainfallResponse = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${previousYear}-01-01&end_date=${previousYear}-12-31&daily=precipitation_sum`
          );

          if (rainfallResponse.ok) {
            const rainfallData = await rainfallResponse.json();
            if (rainfallData.daily && rainfallData.daily.precipitation_sum) {
              const totalRainfall = rainfallData.daily.precipitation_sum.reduce(
                (sum: number, val: number | null) => sum + (val || 0),
                0
              );
              updateField(
                "annualRainfall",
                Math.round(totalRainfall).toString()
              );
            }
          }
        } catch (error) {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter it manually.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to detect your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              "Location permission was denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              "Location information is unavailable. Please check your internet connection.";
            break;
          case error.TIMEOUT:
            errorMessage +=
              "The request to get your location timed out. Please try again.";
            break;
          default:
            errorMessage += `An unknown error occurred (${error.message}).`;
        }

        console.error("Geolocation error:", error);
        console.error("Error details:", errorMessage);
        alert(errorMessage);
        setIsDetectingLocation(false);
      }
    );
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const data: ProjectInput & {
      userName: string;
      userContact: string;
      locationName: string;
      currentWaterSources?: string;
      roofPolygon?: number[][];
      siteAnalysis?: SiteAnalysis;
    } = {
      userName: formData.userName,
      userContact: formData.userContact,
      locationName: formData.locationName,
      roofArea: parseFloat(formData.roofArea),
      roofType: formData.roofType,
      householdSize: parseInt(formData.householdSize),
      waterScarcityDays: parseInt(formData.waterScarcityDays),
      annualRainfall: parseFloat(formData.annualRainfall),
      rainfallIntensity: parseFloat(formData.rainfallIntensity),
      aquiferType: formData.aquiferType,
      availableSpace: formData.availableSpace
        ? parseFloat(formData.availableSpace)
        : undefined,
      depthWaterPremonsoon: formData.depthWaterPremonsoon
        ? parseFloat(formData.depthWaterPremonsoon)
        : undefined,
      depthWaterPostmonsoon: formData.depthWaterPostmonsoon
        ? parseFloat(formData.depthWaterPostmonsoon)
        : undefined,
      infiltrationRate: formData.infiltrationRate
        ? parseFloat(formData.infiltrationRate)
        : undefined,
      soilType: formData.soilType || undefined,
      currentWaterSources: formData.currentWaterSources || undefined,
      roofPolygon: roofPolygon.length > 0 ? roofPolygon : undefined,
      siteAnalysis: siteAnalysis || undefined,
    };

    onComplete(data);
  };

  const steps = [
    { num: 1, title: "Personal Info", icon: User },
    { num: 2, title: "Property", icon: Home },
    { num: 3, title: "Satellite", icon: Satellite },
    { num: 4, title: "Household", icon: Users },
    { num: 5, title: "Site Data", icon: Cloud },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">RTRWH Assessment</h1>
          <p className="text-blue-100">
            Roof Top Rain Water Harvesting Feasibility Study
          </p>

          <div className="mt-8 flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: currentStep === step.num ? 1.1 : 1,
                      backgroundColor:
                        currentStep > step.num
                          ? "#10B981"
                          : currentStep === step.num
                          ? "#fff"
                          : "rgba(255,255,255,0.3)",
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-colors relative ${
                      currentStep === step.num ? "text-blue-600" : "text-white"
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <span className="text-xs mt-2 font-medium hidden md:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{
                        width: currentStep > step.num ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-green-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      id="userName"
                      value={formData.userName}
                      onChange={(e) => updateField("userName", e.target.value)}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="userName"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Full Name *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      id="userContact"
                      value={formData.userContact}
                      onChange={(e) =>
                        updateField("userContact", e.target.value)
                      }
                      placeholder=" "
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="userContact"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Contact Number *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="locationName"
                      value={formData.locationName}
                      onChange={(e) =>
                        updateField("locationName", e.target.value)
                      }
                      placeholder=" "
                      className="peer w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="locationName"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Location/Address *
                    </label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Detect my location"
                    >
                      {isDetectingLocation ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="relative">
                    <input
                      type="number"
                      id="roofArea"
                      value={formData.roofArea}
                      onChange={(e) => updateField("roofArea", e.target.value)}
                      placeholder=" "
                      min="10"
                      step="0.1"
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="roofArea"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Roof Area (sq.m) *
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Measure the total rooftop area available for collection
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Roof Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          value: "GI Sheet",
                          label: "GI Sheet (0.9)",
                          image: "/screenshot_2025-12-31_041043.png",
                        },
                        {
                          value: "Asbestos",
                          label: "Asbestos (0.8)",
                          image: "/screenshot_2025-12-31_041141.png",
                        },
                        {
                          value: "Tiles",
                          label: "Tiles (0.75)",
                          image: "/screenshot_2025-12-31_041244.png",
                        },
                        {
                          value: "Concrete",
                          label: "Concrete (0.7)",
                          image: "/screenshot_2025-12-31_041546.png",
                        },
                      ].map((type) => (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("roofType", type.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative overflow-hidden rounded-xl border-3 transition-all ${
                            formData.roofType === type.value
                              ? "border-blue-500 ring-4 ring-blue-200"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={type.image}
                              alt={type.value}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div
                            className={`p-3 text-center font-semibold ${
                              formData.roofType === type.value
                                ? "bg-blue-500 text-white"
                                : "bg-gray-50 text-gray-800"
                            }`}
                          >
                            {type.label}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      id="availableSpace"
                      value={formData.availableSpace}
                      onChange={(e) =>
                        updateField("availableSpace", e.target.value)
                      }
                      placeholder=" "
                      min="1"
                      step="0.1"
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                    />
                    <label
                      htmlFor="availableSpace"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Available Space for Structures (sq.m)
                    </label>
                  </div>
                </>
              )}

              {currentStep === 3 && userLatitude && userLongitude && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Satellite className="w-5 h-5 text-blue-600" />
                      Measure Your Roof Area
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Use the satellite view below to trace your roof outline.
                      This provides the most accurate measurement for your
                      rainwater harvesting system.
                    </p>
                    {roofPolygon.length > 0 && (
                      <div className="bg-white rounded-lg p-3 mt-3">
                        <p className="text-xs text-gray-600">
                          Satellite-measured area will be used for calculations
                        </p>
                      </div>
                    )}
                  </div>

                  <SatelliteMap
                    latitude={userLatitude}
                    longitude={userLongitude}
                    onRoofAreaCalculated={(area, polygon) => {
                      setRoofPolygon(polygon);
                      updateField("roofArea", area.toFixed(2));
                    }}
                    onAnalysisComplete={(analysis) => {
                      setSiteAnalysis(analysis);
                    }}
                  />

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Tip:</span> You can skip
                      this step and enter roof area manually in the next step,
                      but satellite measurement provides better accuracy.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (!userLatitude || !userLongitude) && (
                <div className="text-center py-12">
                  <Satellite className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Location Required
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Please detect or enter your location in Step 1 to use
                    satellite imagery
                  </p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go to Step 1
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <>
                  <div className="relative">
                    <input
                      type="number"
                      id="householdSize"
                      value={formData.householdSize}
                      onChange={(e) =>
                        updateField("householdSize", e.target.value)
                      }
                      placeholder=" "
                      min="1"
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="householdSize"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Number of Persons in Household *
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      id="waterScarcityDays"
                      value={formData.waterScarcityDays}
                      onChange={(e) =>
                        updateField("waterScarcityDays", e.target.value)
                      }
                      placeholder=" "
                      min="1"
                      max="365"
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="waterScarcityDays"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Period of Water Scarcity (days) *
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Typical range: 30-200 days per year
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      id="currentWaterSources"
                      value={formData.currentWaterSources}
                      onChange={(e) =>
                        updateField("currentWaterSources", e.target.value)
                      }
                      placeholder=" "
                      rows={3}
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all resize-none"
                    />
                    <label
                      htmlFor="currentWaterSources"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Current Water Sources
                    </label>
                  </div>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <div className="relative">
                    <input
                      type="number"
                      id="annualRainfall"
                      value={formData.annualRainfall}
                      onChange={(e) =>
                        updateField("annualRainfall", e.target.value)
                      }
                      placeholder=" "
                      min="100"
                      step="1"
                      className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      required
                    />
                    <label
                      htmlFor="annualRainfall"
                      className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                      Annual Average Rainfall (mm) *
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aquifer Type *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          value: "Unconsolidated",
                          label: "Unconsolidated",
                          desc: "Alluvial - Best for recharge",
                          color: "bg-green-100 border-green-300",
                        },
                        {
                          value: "Semi-consolidated",
                          label: "Semi-consolidated",
                          desc: "Moderate suitability",
                          color: "bg-yellow-100 border-yellow-300",
                        },
                        {
                          value: "Consolidated",
                          label: "Consolidated",
                          desc: "Hard rock - Limited recharge",
                          color: "bg-red-100 border-red-300",
                        },
                      ].map((type) => (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("aquiferType", type.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.aquiferType === type.value
                              ? `${type.color}`
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-600">
                            {type.desc}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        id="depthWaterPremonsoon"
                        value={formData.depthWaterPremonsoon}
                        onChange={(e) =>
                          updateField("depthWaterPremonsoon", e.target.value)
                        }
                        placeholder=" "
                        min="0"
                        step="0.1"
                        className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      />
                      <label
                        htmlFor="depthWaterPremonsoon"
                        className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                      >
                        Pre-monsoon Depth (m)
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        id="depthWaterPostmonsoon"
                        value={formData.depthWaterPostmonsoon}
                        onChange={(e) =>
                          updateField("depthWaterPostmonsoon", e.target.value)
                        }
                        placeholder=" "
                        min="0"
                        step="0.1"
                        className="peer w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                      />
                      <label
                        htmlFor="depthWaterPostmonsoon"
                        className="absolute left-4 top-3 text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-[-12px] peer-focus:text-sm peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                      >
                        Post-monsoon Depth (m)
                      </label>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <motion.button
              onClick={prevStep}
              disabled={currentStep === 1}
              whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
              whileTap={{ scale: currentStep === 1 ? 1 : 0.98 }}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </motion.button>

            <span className="text-sm font-semibold text-gray-600">
              {currentStep} / {totalSteps}
            </span>

            {currentStep < totalSteps ? (
              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-600 transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                <Save className="w-5 h-5" />
                Generate Report
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
