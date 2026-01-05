import { useState, useEffect } from "react";
import {
  Droplets,
  FileText,
  Calculator,
  TrendingUp,
  Users,
  Home,
  Wallet,
  Award,
  LogIn,
  LogOut,
  UserCircle,
  ChevronDown,
  HelpCircle,
  Building2,
  Activity,
} from "lucide-react";
import { VideoPlayer } from "./components/VideoPlayer";
import { motion } from "framer-motion";
import AssessmentWizard from "./components/AssessmentWizard";
import ResultsDashboard from "./components/ResultsDashboard";
import GovernmentDashboard from "./components/GovernmentDashboard";
import IotDashboard from "./components/IotDashboard";
// Removed Chatbot import
import AuthModal from "./components/AuthModal";
import PasswordReset from "./components/PasswordReset";
import { ProjectInput, performCompleteCalculation } from "./lib/calculations";
import {
  calculateCostBreakdown,
  calculateAnnualBenefits,
  performEconomicAnalysis,
} from "./lib/costEstimation";
import { saveProject, saveCalculationResults, supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

function App() {
  const [currentView, setCurrentView] = useState<
    "home" | "wizard" | "results" | "government" | "iot"
  >("home");
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isGovernmentUser, setIsGovernmentUser] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      setIsPasswordReset(true);
    }
  }, []);

  const checkGovernmentUser = async (userId: string) => {
    const { data } = await supabase
      .from("government_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    setIsGovernmentUser(!!data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkGovernmentUser(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsGovernmentUser(false);
          setAssessmentData(null);
          setCalculationResults(null);
          setCurrentView("home");
        } else {
          setUser(session?.user ?? null);

          if (session?.user) {
            await checkGovernmentUser(session.user.id);
          } else {
            setIsGovernmentUser(false);
          }
        }

        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordReset(true);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserMenu) setShowUserMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    if (currentView === "wizard" && !user) {
      setCurrentView("home");
      setIsAuthModalOpen(true);
    }
    if (currentView === "government" && !isGovernmentUser) {
      setCurrentView("home");
    }
  }, [currentView, user, isGovernmentUser]);

  const handleAssessmentComplete = async (
    data: ProjectInput & {
      userName: string;
      userContact: string;
      locationName: string;
      currentWaterSources?: string;
      roofPolygon?: number[][];
      siteAnalysis?: any;
    }
  ) => {
    const results = performCompleteCalculation(data);

    const costBreakdown = calculateCostBreakdown({
      tankCapacity: results.tankCapacity,
      roofArea: data.roofArea,
      gutterLength: data.roofArea * 0.4,
      downpipeLength: 5,
      filterArea: results.filterArea,
      rechargeStructureType: results.rechargeStructureType,
      rechargeStructureDepth: results.rechargeStructureDepth,
      rechargeStructureDiameter: results.rechargeStructureDiameter,
      waterSavingsVolume: results.isFeasible
        ? results.waterRequired
        : results.waterAvailable,
      depthWaterPremonsoon: data.depthWaterPremonsoon,
    });

    const depthReduction =
      data.depthWaterPremonsoon && data.depthWaterPostmonsoon
        ? data.depthWaterPremonsoon - data.depthWaterPostmonsoon
        : undefined;

    const annualBenefits = calculateAnnualBenefits(
      results.isFeasible ? results.waterRequired : results.waterAvailable,
      depthReduction
    );

    const economicAnalysis = performEconomicAnalysis(
      costBreakdown,
      annualBenefits,
      20,
      0.08,
      0
    );

    setAssessmentData({ ...data, results, costBreakdown, economicAnalysis });
    setCalculationResults({ results, costBreakdown, economicAnalysis });

    const projectData = {
      user_name: data.userName,
      user_contact: data.userContact,
      location_name: data.locationName,
      roof_area: data.roofArea,
      roof_type: data.roofType,
      roof_height: 3,
      household_size: data.householdSize,
      available_space: data.availableSpace,
      water_scarcity_days: data.waterScarcityDays,
      current_water_sources: data.currentWaterSources,
      annual_rainfall: data.annualRainfall,
      rainfall_intensity: data.rainfallIntensity,
      aquifer_type: data.aquiferType,
      depth_water_premonsoon: data.depthWaterPremonsoon,
      depth_water_postmonsoon: data.depthWaterPostmonsoon,
      soil_type: data.soilType,
      infiltration_rate: data.infiltrationRate,
      roof_polygon: data.roofPolygon,
      elevation: data.siteAnalysis?.elevation,
      slope: data.siteAnalysis?.slope,
      shadow_analysis: data.siteAnalysis?.shadowAnalysis,
      nearby_water_bodies: data.siteAnalysis?.nearbyWaterBodies,
      site_recommendations: data.siteAnalysis?.recommendations,
      site_warnings: data.siteAnalysis?.warnings,
    };

    const savedProject = await saveProject(projectData);

    if (savedProject) {
      const resultsData = {
        project_id: savedProject.id,
        water_available: results.waterAvailable,
        water_required: results.waterRequired,
        is_feasible: results.isFeasible,
        tank_capacity: results.tankCapacity,
        tank_diameter: results.tankDiameter,
        tank_height: results.tankHeight,
        peak_flow: results.peakFlow,
        gutter_diameter: results.gutterDiameter,
        downpipe_diameter: results.downpipeDiameter,
        first_flush_volume: results.firstFlushVolume,
        filter_type: results.filterType,
        filter_area: results.filterArea,
        filter_length: results.filterLength,
        filter_width: results.filterWidth,
        recharge_structure_type: results.rechargeStructureType,
        recharge_structure_depth: results.rechargeStructureDepth,
        recharge_structure_diameter: results.rechargeStructureDiameter,
        total_cost: costBreakdown.totalCost,
        annual_benefits: annualBenefits,
        bc_ratio: economicAnalysis.bcRatio,
        payback_period: economicAnalysis.paybackPeriod,
      };

      await saveCalculationResults(resultsData);
    }

    setCurrentView("results");
  };

  const handleNewAssessment = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView("wizard");
    setAssessmentData(null);
    setCalculationResults(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsGovernmentUser(false);
      setShowUserMenu(false);
      setCurrentView("home");
      setAssessmentData(null);
      setCalculationResults(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isPasswordReset) {
    return (
      <PasswordReset
        onComplete={() => {
          setIsPasswordReset(false);
          window.history.replaceState({}, document.title, "/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center cursor-pointer"
              onClick={() => setCurrentView("home")}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <Droplets className="w-10 h-10 text-blue-600" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">Varun</h1>
                <p className="text-xs text-gray-600">RTRWH Assessment Tool</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              {user && currentView !== "wizard" && currentView !== "home" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView("home")}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-200 transition-colors"
                >
                  Home
                </motion.button>
              )}

              {user && (
                <>
                  {isGovernmentUser && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView("government")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Government
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView("iot")}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium shadow-sm hover:bg-cyan-700 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    IoT
                  </motion.button>
                </>
              )}

              {currentView === "results" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewAssessment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
                >
                  New Assessment
                </motion.button>
              )}

              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <UserCircle className="w-5 h-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.user_metadata?.name || user.email?.split("@")[0]}
                    </span>
                  </motion.button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user.user_metadata?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {user.email}
                        </p>
                        {user.user_metadata?.phone && (
                          <p className="text-xs text-gray-600 mt-1">
                            {user.user_metadata.phone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setCurrentView("wizard");
        }}
      />

      <main>
        {currentView === "home" && (
          <>
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-blue-50">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

              <div className="absolute inset-0 pointer-events-none">
                {[...Array(25)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-0.5 bg-gradient-to-b from-blue-400/0 via-blue-400/40 to-blue-400/0"
                    style={{
                      left: `${Math.random() * 100}%`,
                      height: `${20 + Math.random() * 30}px`,
                    }}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{
                      y: ["0vh", "100vh"],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 1.5 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                      ease: "linear",
                    }}
                  />
                ))}
              </div>

              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-20 right-20 w-64 h-64 bg-blue-200 rounded-full filter blur-3xl opacity-20" />
                <div className="absolute bottom-32 left-20 w-80 h-80 bg-teal-200 rounded-full filter blur-3xl opacity-20" />
              </div>

              <div className="relative z-10 max-w-6xl mx-auto px-6 text-center py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8"
                >
                  <Droplets className="w-4 h-4" />
                  Professional RTRWH Assessment Tool
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight"
                >
                  Rainwater Harvesting
                  <br />
                  <span className="text-blue-600">Made Intelligent</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                  Calculate rooftop potential, design structures, and analyze
                  costs with precision. Following CGWB guidelines and powered by
                  AI.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (user) {
                      setCurrentView("wizard");
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-base shadow-lg hover:bg-blue-700 transition-all"
                >
                  Start Your Assessment
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                >
                  {[
                    { number: "50K+", label: "Litres Saved", Icon: Droplets },
                    { number: "1200+", label: "Installations", Icon: Home },
                    { number: "₹2.5Cr", label: "Cost Saved", Icon: Wallet },
                    { number: "98%", label: "Satisfaction", Icon: Award },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    >
                      <stat.Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-8 h-12 border-2 border-gray-300 rounded-full flex items-start justify-center p-2">
                  <div className="w-1 h-3 bg-gray-400 rounded-full" />
                </div>
              </motion.div>
            </section>

            {/* Video Section */}
            <section className="py-12 bg-white">
              <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    See It In Action
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Watch how our rainwater harvesting system works
                  </p>
                </div>

                <VideoPlayer />

                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>
                    Click on the video to play/pause. Use the button in the
                    bottom right to toggle sound.
                  </p>
                </div>
              </div>
            </section>

            <section className="py-20 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    Powerful Features
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Everything you need for complete rainwater harvesting
                    assessment
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Calculator,
                      title: "Complete Calculations",
                      gradient: "from-blue-500 to-blue-600",
                      items: [
                        "Water availability",
                        "Tank sizing",
                        "Collection design",
                        "Filter specs",
                        "Recharge structures",
                      ],
                    },
                    {
                      icon: TrendingUp,
                      title: "Economic Analysis",
                      gradient: "from-teal-500 to-teal-600",
                      items: [
                        "Cost breakdown",
                        "B/C ratio",
                        "Payback period",
                        "NPV analysis",
                        "Subsidy impact",
                      ],
                    },
                    {
                      icon: FileText,
                      title: "Detailed Reports",
                      gradient: "from-green-500 to-green-600",
                      items: [
                        "Technical specs",
                        "Design drawings",
                        "Bill of quantities",
                        "Implementation guide",
                        "O&M procedures",
                      ],
                    },
                    {
                      icon: Building2,
                      title: "Government Integration Suite",
                      gradient: "from-green-600 to-emerald-600",
                      items: [
                        "Installation tracking",
                        "Subsidy management",
                        "Compliance monitoring",
                        "Impact analytics",
                        "Policy insights",
                      ],
                    },
                    {
                      icon: Activity,
                      title: "IoT Dashboard",
                      gradient: "from-cyan-500 to-blue-600",
                      items: [
                        "Real-time monitoring",
                        "Water level tracking",
                        "Flow rate sensors",
                        "Quality analytics",
                        "Predictive alerts",
                      ],
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                      whileHover={{ y: -10 }}
                      className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
                    >
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        {feature.title}
                      </h3>
                      <ul className="space-y-3">
                        {feature.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center text-gray-600"
                          >
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full mr-3" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300 rounded-full filter blur-3xl" />
              </div>

              <div className="max-w-7xl mx-auto px-4 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    CGWB Certified
                  </h2>
                  <p className="text-xl text-blue-100">
                    Based on Central Ground Water Board Manual (2007)
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20"
                  >
                    <h3 className="text-2xl font-bold mb-6 flex items-center">
                      <Droplets className="mr-3" /> RTRWH Components
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Catchment area (roof)",
                        "Collection system",
                        "First flush device",
                        "Filter unit",
                        "Storage tank",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <div className="w-2 h-2 bg-teal-300 rounded-full mr-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20"
                  >
                    <h3 className="text-2xl font-bold mb-6 flex items-center">
                      <Users className="mr-3" /> Artificial Recharge
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Recharge pits",
                        "Recharge shafts",
                        "Injection wells",
                        "Percolation tanks",
                        "Subsurface dykes",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <div className="w-2 h-2 bg-blue-300 rounded-full mr-3" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </div>
            </section>

            <section className="py-20 bg-white">
              <div className="max-w-4xl mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                    <HelpCircle className="w-4 h-4" />
                    Got Questions?
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xl text-gray-600">
                    Everything you need to know about rainwater harvesting
                  </p>
                </motion.div>

                <div className="space-y-4">
                  {[
                    {
                      question: "What is Rooftop Rainwater Harvesting (RTRWH)?",
                      answer:
                        "RTRWH is a technique of collecting and storing rainwater from rooftops for later use or for recharging groundwater. It involves collecting rainwater from roof surfaces, filtering it, and either storing it in tanks or directing it to recharge structures to replenish groundwater.",
                    },
                    {
                      question:
                        "How much water can I save with rainwater harvesting?",
                      answer:
                        "The amount depends on your roof area and local rainfall. For example, a 100 sq.m roof in an area with 1000mm annual rainfall can potentially harvest around 80,000 liters per year (accounting for losses). Our assessment tool calculates the exact potential for your specific location and roof size.",
                    },
                    {
                      question:
                        "What is the typical cost of installing a rainwater harvesting system?",
                      answer:
                        "Costs vary based on system size and complexity. A basic system for a residential building typically ranges from ₹50,000 to ₹2,00,000. This includes collection systems, filters, storage tanks, and recharge structures. Our tool provides a detailed cost breakdown specific to your requirements.",
                    },
                    {
                      question:
                        "How long does it take to recover the investment?",
                      answer:
                        "The payback period typically ranges from 5-10 years, depending on water costs in your area and the system size. Many systems show positive returns within 7-8 years through reduced water bills and increased property value. Our economic analysis calculates the exact payback period for your project.",
                    },
                    {
                      question: "Is rainwater harvesting mandatory?",
                      answer:
                        "Many Indian states and cities have made rainwater harvesting mandatory for buildings above certain sizes. For example, it is mandatory in Delhi, Chennai, Bangalore, and many other cities for buildings with roof areas exceeding 100-300 sq.m. Check your local building regulations for specific requirements.",
                    },
                    {
                      question: "What maintenance is required?",
                      answer:
                        "Regular maintenance includes cleaning gutters and filters (monthly during rainy season), inspecting tanks for cracks or leaks (annually), cleaning first flush devices after heavy rains, and checking recharge structures for blockages. Most maintenance tasks are simple and can be done without professional help.",
                    },
                    {
                      question: "Can harvested rainwater be used for drinking?",
                      answer:
                        "Yes, with proper filtration and treatment. The water should pass through multi-stage filtration, UV treatment, or other purification methods before drinking. Many systems are designed primarily for non-potable uses like gardening, toilet flushing, and washing, which do not require extensive treatment.",
                    },
                    {
                      question:
                        "What is groundwater recharge and why is it important?",
                      answer:
                        "Groundwater recharge is the process of directing rainwater into the ground to replenish aquifers. This is crucial in urban areas where concrete surfaces prevent natural percolation. Recharge helps maintain groundwater levels, prevents land subsidence, and improves water quality in aquifers.",
                    },
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200"
                    >
                      <button
                        onClick={() =>
                          setOpenFaqIndex(openFaqIndex === index ? null : index)
                        }
                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-lg font-semibold text-gray-800 pr-4">
                          {faq.question}
                        </span>
                        <motion.div
                          animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        </motion.div>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: openFaqIndex === index ? "auto" : 0,
                          opacity: openFaqIndex === index ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-2">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-12 text-center bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-8"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Still have questions?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try our AI-powered chatbot for instant answers to your
                    specific questions
                  </p>
                  <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                    <HelpCircle className="w-5 h-5" />
                    Look for the chat icon in the bottom right corner
                  </div>
                </motion.div>
              </div>
            </section>
          </>
        )}

        {currentView === "wizard" && (
          <div className="pt-24 pb-16 px-4 min-h-screen bg-gray-50">
            <AssessmentWizard onComplete={handleAssessmentComplete} />
          </div>
        )}

        {currentView === "results" && calculationResults && assessmentData && (
          <div className="pt-24 pb-16 px-4 min-h-screen bg-gray-50">
            <ResultsDashboard
              results={calculationResults.results}
              costBreakdown={calculationResults.costBreakdown}
              economicAnalysis={calculationResults.economicAnalysis}
              projectInput={{
                userName: assessmentData.userName,
                locationName: assessmentData.locationName,
                roofArea: assessmentData.roofArea,
                roofType: assessmentData.roofType,
                householdSize: assessmentData.householdSize,
              }}
            />
          </div>
        )}

        {currentView === "government" && isGovernmentUser && (
          <div className="pt-20">
            <GovernmentDashboard />
          </div>
        )}

        {currentView === "iot" && (
          <div className="pt-20">
            <IotDashboard />
          </div>
        )}
      </main>

      {currentView === "home" && (
        <footer className="bg-gradient-to-r from-blue-900 to-teal-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <Droplets className="w-8 h-8 mr-2" />
                  <span className="text-xl font-bold">Varun</span>
                </div>
                <p className="text-blue-200 text-sm">
                  Professional rainwater harvesting assessment tool following
                  CGWB guidelines
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>Features</li>
                  <li>How it Works</li>
                  <li>Pricing</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Certification</h4>
                <p className="text-blue-200 text-sm">
                  Based on CGWB Manual on Artificial Recharge of Ground Water
                  (2007)
                </p>
                <p className="text-xs mt-2 text-blue-300">
                  Central Ground Water Board
                  <br />
                  Ministry of Jal Shakti, Government of India
                </p>
              </div>
            </div>
            <div className="border-t border-blue-700 pt-6 text-center text-blue-200 text-sm">
              <p>&copy; 2024 Varun. Smart India Hackathon Project.</p>
            </div>
          </div>
        </footer>
      )}
      
      {/* Old Chatbot Removed */}
    </div>
  );
}

export default App;

