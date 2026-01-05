import { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2, MapPin, Loader, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface LocationContext {
  location?: string;
  latitude?: number;
  longitude?: number;
  annualRainfall?: number;
  aquiferType?: string;
  rechargePotential?: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Varun assistant. Ask me anything about rainwater harvesting, our assessment tool, or RTRWH systems!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  
  // --- NEW STATE FOR VOICE ---
  const [isListening, setIsListening] = useState(false); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- NEW FUNCTION: VOICE RECOGNITION ---
  const startListening = () => {
    // Check browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US'; // You can change to 'en-IN' for Indian English
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
    }
  };

  const detectLocation = async () => {
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      setShowLocationInput(true);
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchLocationData(latitude, longitude);
      },
      () => {
        setShowLocationInput(true);
        setIsLoadingLocation(false);
      }
    );
  };

  const fetchLocationData = async (
    latitude: number,
    longitude: number,
    locationName?: string
  ) => {
    try {
      const [rainfallResponse, reverseGeocodeResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rainfall`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }),
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reverse-geocode`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ latitude, longitude }),
          }
        ),
      ]);

      const rainfallData = await rainfallResponse.json();
      const locationData = await reverseGeocodeResponse.json();

      const state = locationData.state || "";
      const displayLocation =
        locationName || locationData.displayLocation || locationData.formatted;

      const aquiferResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aquifer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ state }),
        }
      );

      const aquiferData = await aquiferResponse.json();

      const context: LocationContext = {
        location: displayLocation,
        latitude,
        longitude,
        annualRainfall: rainfallData.annualRainfall,
        aquiferType: aquiferData.aquiferType,
        rechargePotential: aquiferData.rechargePotential,
      };

      setLocationContext(context);
      setIsLoadingLocation(false);
      setShowLocationInput(false);

      const locationMessage: Message = {
        id: Date.now().toString(),
        text: `Location detected: ${displayLocation}\nAnnual Rainfall: ${
          rainfallData.annualRainfall
        } mm\nAquifer Type: ${aquiferData.aquiferType?.replace(
          /_/g,
          " "
        )}\nRecharge Potential: ${aquiferData.rechargePotential}`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, locationMessage]);
    } catch (error) {
      console.error("Location data fetch error:", error);
      setIsLoadingLocation(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Failed to fetch location data. You can still ask questions without location context.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;

    setIsLoadingLocation(true);

    try {
      const geocodeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ location: manualLocation }),
        }
      );

      const geocodeData = await geocodeResponse.json();

      if (geocodeData.error) {
        throw new Error(geocodeData.error);
      }

      await fetchLocationData(
        geocodeData.latitude,
        geocodeData.longitude,
        manualLocation
      );
      setManualLocation("");
    } catch (error) {
      console.error("Manual location error:", error);
      setIsLoadingLocation(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Could not find that location. Please try another location name.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || cooldownActive) return;

    const currentTime = Date.now();
    const timeSinceLastMessage = currentTime - lastMessageTimeRef.current;

    if (timeSinceLastMessage < 2000) {
      const remainingTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
      const cooldownMessage: Message = {
        id: Date.now().toString(),
        text: `Please wait ${remainingTime} second${
          remainingTime > 1 ? "s" : ""
        } before sending another message.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cooldownMessage]);
      return;
    }

    const messageToSend = inputValue;
    lastMessageTimeRef.current = currentTime;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setCooldownActive(true);

    setTimeout(() => {
      setCooldownActive(false);
    }, 2000);

    try {
      // Build system prompt with location context
      let systemPrompt = `You are an AI assistant for Varun, a professional rainwater harvesting assessment tool. Your role is to help users understand:

1. Rainwater harvesting concepts and benefits
2. Rooftop rainwater harvesting (RTRWH) systems
3. How to use the Varun assessment tool
4. Components of RTRWH systems (catchment, collection, filters, storage, recharge)
5. Cost analysis and economic benefits
6. CGWB (Central Ground Water Board) guidelines and standards
7. Technical specifications like tank sizing, filter design, and recharge structures

KEY FEATURES OF VARUN:
- Complete calculations for water availability and requirements
- Tank sizing and design
- Collection system specifications (gutters, downpipes)
- Filter specifications
- Recharge structure design
- Cost breakdown and economic analysis
- B/C ratio and payback period calculations
- Based on CGWB Manual on Artificial Recharge (2007)

IMPORTANT RULES:
- ONLY answer questions related to rainwater harvesting, the Varun tool, water conservation, or related topics
- If asked about unrelated topics, politely redirect to rainwater harvesting topics
- Be helpful, professional, and concise
- Provide accurate technical information when needed
- Encourage users to try the assessment tool

Keep responses clear and helpful, typically 2-4 sentences unless more detail is requested.`;

      if (locationContext && Object.keys(locationContext).length > 0) {
        systemPrompt += `\n\nLOCATION-SPECIFIC CONTEXT (use this data to provide scientifically accurate, location-specific recommendations):\n`;
        if (locationContext.location) {
          systemPrompt += `- Location: ${locationContext.location}\n`;
        }
        if (locationContext.latitude && locationContext.longitude) {
          systemPrompt += `- Coordinates: ${locationContext.latitude.toFixed(
            4
          )}°N, ${locationContext.longitude.toFixed(4)}°E\n`;
        }
        if (locationContext.annualRainfall) {
          systemPrompt += `- Annual Rainfall: ${locationContext.annualRainfall} mm\n`;
        }
        if (locationContext.aquiferType) {
          const aquiferTypeReadable = locationContext.aquiferType.replace(
            /_/g,
            " "
          );
          systemPrompt += `- Aquifer Type: ${aquiferTypeReadable}\n`;
        }
        if (locationContext.rechargePotential) {
          systemPrompt += `- Groundwater Recharge Potential: ${locationContext.rechargePotential}\n`;
        }
        systemPrompt += `\nIMPORTANT: Based on the above data, provide tailored recommendations for:\n1. Whether to prioritize STORAGE (tanks) or RECHARGE (percolation pits, recharge wells)\n2. Suitable RWH system components based on aquifer type and rainfall\n3. Expected water availability and storage capacity requirements\n4. Any location-specific considerations or warnings\n`;
      }

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      console.log("Sending message to backend chatbot API...", {
        messageToSend,
        hasLocation: !!locationContext,
      });

      const response = await fetch("http://localhost:3000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          locationContext: locationContext || undefined,
        }),
      });

      console.log("Backend API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Backend API error response:", errorData);
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log("Backend API response:", data);

      const botResponse =
        data.response || "Sorry, I encountered an error. Please try again.";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error details:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200"
          >
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src="/image copy.png"
                    alt="Assistant"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Varun Assistant</h3>
                    <p className="text-xs text-blue-100">
                      Powered by Gemini AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={detectLocation}
                    disabled={isLoadingLocation}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Detect my location"
                  >
                    {isLoadingLocation ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {locationContext && (
                <div className="text-xs bg-white/20 rounded-lg px-3 py-2 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="font-medium">
                      {locationContext.location}
                    </span>
                  </div>
                  <div className="mt-1 text-blue-50">
                    {locationContext.annualRainfall}mm rainfall •{" "}
                    {locationContext.aquiferType?.replace(/_/g, " ")}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white"
                        : "bg-white text-gray-800 shadow-sm border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showLocationInput && (
              <div className="p-3 bg-blue-50 border-t border-blue-200">
                <p className="text-xs text-blue-800 mb-2 font-medium">
                  Enter your location for personalized recommendations:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleManualLocation();
                      }
                    }}
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoadingLocation}
                  />
                  <button
                    onClick={handleManualLocation}
                    disabled={isLoadingLocation || !manualLocation.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingLocation ? "Loading..." : "Set"}
                  </button>
                  <button
                    onClick={() => setShowLocationInput(false)}
                    className="text-blue-600 px-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask about rainwater harvesting..."}
                  className={`flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isListening ? 'bg-red-50' : ''}`}
                  disabled={isLoading}
                />
                
                {/* --- VOICE INPUT BUTTON --- */}
                <button
                  onClick={startListening}
                  className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title="Voice Input"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={isLoading || cooldownActive || !inputValue.trim()}
                  className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 right-6 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="minimize"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-16 h-16 flex items-center justify-center bg-white rounded-full text-blue-600"
            >
              <Minimize2 className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="avatar"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src="/image copy.png"
                alt="Chat"
                className="w-16 h-16 rounded-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>
    </>
  );
}
