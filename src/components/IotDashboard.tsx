import { useState, useEffect } from 'react';
import { database } from '../lib/firebase'; // Importing from your firebase.ts file
import { ref, onValue, off, push, set } from 'firebase/database';
import { Droplet, Gauge, ThermometerSun, Activity, Plus, Bell, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types definition
interface SensorReading {
  id: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface Device {
  id: string;
  name: string;
  type: 'water_level' | 'flow_meter' | 'temperature' | 'quality';
  location: string;
  status: 'active' | 'inactive';
  lastSeen: string;
  readings: Record<string, {
    value: number;
    unit: string;
    timestamp: string;
    type: string;
  }>;
}

export default function IotDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    name: '',
    id: '',
    type: 'water_level',
    location: '',
  });
  const [alerts, setAlerts] = useState<string[]>([]);

  // 1. Firebase Listener
  useEffect(() => {
    // This connects to the 'devices' node in your Firebase Database
    const devicesRef = ref(database, 'devices');

    // onValue subscribes to real-time updates
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      setLoading(true);
      const data = snapshot.val();

      if (data) {
        const loadedDevices: Device[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          name: value.name || 'Unknown Device',
          type: value.type || 'water_level',
          location: value.location || 'Unknown',
          status: value.status || 'active',
          lastSeen: value.lastSeen || new Date().toISOString(),
          readings: value.readings || {}
        }));

        setDevices(loadedDevices);
        checkAlerts(loadedDevices);
      } else {
        setDevices([]);
      }
      setLoading(false);
    });

    // Cleanup subscription when component unmounts
    return () => off(devicesRef);
  }, []);

  // 2. Alert Logic
  const checkAlerts = (currentDevices: Device[]) => {
    const newAlerts: string[] = [];
    currentDevices.forEach(device => {
      // Get the latest reading if available
      const readings = Object.values(device.readings || {});
      if (readings.length > 0) {
        // Sort by timestamp descending
        const latest = readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (device.type === 'water_level' && latest.value < 20) {
          newAlerts.push(`${device.name}: Low water level (${latest.value}%)`);
        }
        if (device.type === 'water_level' && latest.value > 90) {
          newAlerts.push(`${device.name}: Tank nearly full (${latest.value}%)`);
        }
      }
    });
    setAlerts(newAlerts);
  };

  // 3. Add New Device Function (Writes to Firebase)
  const addDevice = async () => {
    try {
      if (!newDevice.name || !newDevice.id) return;

      const newDeviceRef = ref(database, `devices/${newDevice.id}`);
      await set(newDeviceRef, {
        name: newDevice.name,
        type: newDevice.type,
        location: newDevice.location,
        status: 'active',
        lastSeen: new Date().toISOString(),
        readings: {} // Initialize with empty readings
      });

      setShowAddDevice(false);
      setNewDevice({ name: '', id: '', type: 'water_level', location: '' });
    } catch (error) {
      console.error("Error adding device:", error);
    }
  };

  // 4. Helper to simulate data (Optional - for testing)
  const simulateData = async (deviceId: string) => {
    const readingRef = ref(database, `devices/${deviceId}/readings`);
    const newReadingRef = push(readingRef);
    const device = devices.find(d => d.id === deviceId);

    let value = 0;
    let unit = '';

    if (device?.type === 'water_level') { value = Math.floor(Math.random() * 100); unit = '%'; }
    else if (device?.type === 'temperature') { value = 20 + Math.random() * 15; unit = '°C'; }
    else { value = Math.random() * 50; unit = 'units'; }

    await set(newReadingRef, {
      value: value,
      unit: unit,
      type: device?.type,
      timestamp: new Date().toISOString()
    });

    // Update last seen
    await set(ref(database, `devices/${deviceId}/lastSeen`), new Date().toISOString());
  };

  // UI Helpers
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'water_level': return <Droplet className="w-6 h-6" />;
      case 'flow_meter': return <Gauge className="w-6 h-6" />;
      case 'temperature': return <ThermometerSun className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const formatChartData = (readings: Record<string, any>) => {
    return Object.values(readings)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20) // Last 20 readings
      .map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.value
      }));
  };

  if (loading && devices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500">Connecting to Firebase IoT...</p>
        </div>
      </div>
    );
  }

  const selectedDeviceData = devices.find(d => d.id === selectedDevice);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IoT Dashboard</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live via Firebase Realtime Database
            </p>
          </div>
          <button
            onClick={() => setShowAddDevice(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">System Alerts</h3>
                <ul className="space-y-1">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="text-sm text-red-700">{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {devices.map((device) => {
            const isOnline = (new Date().getTime() - new Date(device.lastSeen).getTime()) < 60000; // 1 min threshold
            const latestReadings = Object.values(device.readings || {}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const currentReading = latestReadings[0];

            return (
              <div
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md ${selectedDevice === device.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{device.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{device.id}</p>
                    </div>
                  </div>
                  {isOnline ? (
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                      <Wifi className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      <WifiOff className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">Offline</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {currentReading ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Reading</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {Number(currentReading.value).toFixed(1)}
                        </span>
                        <span className="text-gray-500 font-medium">{currentReading.unit}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Last updated: {new Date(currentReading.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-400 text-sm bg-gray-50 rounded-lg">
                      No data received yet
                    </div>
                  )}
                </div>

                {/* Simulation Button (Dev only) */}
                <button
                  onClick={(e) => { e.stopPropagation(); simulateData(device.id); }}
                  className="mt-4 w-full py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Simulate Incoming Data
                </button>
              </div>
            );
          })}
        </div>

        {/* Historical Chart Section */}
        {selectedDeviceData && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDeviceData.name} History
              </h2>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Close View
              </button>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatChartData(selectedDeviceData.readings || {})}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Add Device Modal */}
        {showAddDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Connect New Device</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Device Name</label>
                  <input
                    type="text"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Roof Tank Sensor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Unique Device ID</label>
                  <input
                    type="text"
                    value={newDevice.id}
                    onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. ESP32-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Sensor Type</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="water_level">Water Level</option>
                    <option value="flow_meter">Flow Meter</option>
                    <option value="temperature">Temperature</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Block A"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddDevice(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addDevice}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}