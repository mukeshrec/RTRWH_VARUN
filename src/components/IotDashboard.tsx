import { useState, useEffect } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Loader2, Wifi, CheckCircle, Activity } from 'lucide-react';

export default function IotDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // The path 'iot/pit001' is used based on previous logs indicating nesting
  const DB_PATH = 'iot/pit001'; 

  const connectToESP32 = () => {
    setIsConnecting(true);
    
    // Updated reference to point to the full nested path
    const dataRef = ref(database, DB_PATH); 
    
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      console.log(`ESP32 Data at ${DB_PATH}:`, data); 
      
      if (data) {
        setStats(data);
        setIsConnected(true);
      } else {
        console.warn(`No data found at ${DB_PATH}. Check your Firebase path.`);
      }
      setIsConnecting(false);
    }, (error) => {
      console.error("Firebase Subscription Error:", error);
      setIsConnecting(false);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const dataRef = ref(database, DB_PATH);
      off(dataRef);
    };
  }, []);

  const MetricCard = ({ title, value, unit, color = "text-black" }: any) => (
    <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col justify-between min-h-[160px] transition-all hover:shadow-md">
      <h3 className="text-gray-700 font-bold text-lg">{title}</h3>
      <div className="flex items-baseline gap-2 mt-4">
        <span className={`text-4xl font-extrabold ${isConnected ? color : 'text-gray-300'}`}>
          {isConnected && (value !== undefined && value !== null) ? value : '--'}
        </span>
        {unit && <span className="text-xl font-bold text-gray-400">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">V</div>
          <div>
            <span className="font-bold text-gray-900 block leading-none">Varun</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">RTRWH Assessment Tool</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-gray-600">Home</button>
          <button className="bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" /> IoT
          </button>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
            <span className="text-sm font-medium text-gray-700">Mukesh V</span>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-[#0095ff] to-[#00d4ff] pt-20 pb-24 text-center text-white">
        <h1 className="text-6xl font-black tracking-[0.25em] mb-4 uppercase">Varun</h1>
        <p className="text-lg font-medium opacity-90 italic">Smart Rooftop Rainwater Harvesting Monitor</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="flex justify-center mb-16">
          <button 
            onClick={connectToESP32}
            disabled={isConnected || isConnecting}
            className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-all active:scale-95 ${
              isConnected 
                ? 'bg-green-500 text-white cursor-default shadow-green-100' 
                : 'bg-[#0066ff] hover:bg-blue-700 text-white'
            }`}
          >
            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : isConnected ? <CheckCircle className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
            {isConnecting ? 'Searching...' : isConnected ? 'ESP32 Connected' : 'Connect ESP32'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          <MetricCard 
            title="Ultrasonic Level" 
            value={stats?.ultrasonic_cm} 
            unit="cm" 
          />
          <MetricCard 
            title="Rain Intensity (ADC)" 
            value={stats?.rain_adc} 
          />
          <MetricCard 
            title="Water Saved (Today)" 
            value={stats?.water_saved_today} 
            unit="L" 
          />
          <MetricCard 
            title="Total Water Saved" 
            value={stats?.total_water_saved ? Number(stats.total_water_saved).toFixed(2) : null} 
            unit="L" 
          />
          <MetricCard 
            title="Pit Status" 
            value={stats?.pit_status} 
            color={stats?.pit_status === 'normal' ? "text-green-500" : "text-yellow-500"} 
          />
          <MetricCard 
            title="Achievement" 
            value={stats?.badge} 
          />
        </div>
      </div>
    </div>
  );
}