import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Droplet, Gauge, ThermometerSun, Activity, Plus, Settings, Bell, TrendingUp, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Device {
  id: string;
  device_name: string;
  device_id: string;
  device_type: string;
  status: string;
  last_reading_at: string | null;
  metadata: {
    location?: string;
    capacity?: number;
  };
}

interface SensorReading {
  id: string;
  device_id: string;
  reading_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface DeviceData {
  device: Device;
  latestReadings: Record<string, SensorReading>;
  historicalData: SensorReading[];
}

export default function IotDashboard() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_id: '',
    device_type: 'water_level',
    location: '',
  });
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDevices = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: devicesData } = await supabase
        .from('iot_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (devicesData) {
        const devicesWithData = await Promise.all(
          devicesData.map(async (device) => {
            const { data: readings } = await supabase
              .from('sensor_readings')
              .select('*')
              .eq('device_id', device.id)
              .order('timestamp', { ascending: false })
              .limit(100);

            const latestReadings: Record<string, SensorReading> = {};
            const readingsByType: Record<string, SensorReading[]> = {};

            readings?.forEach(reading => {
              if (!latestReadings[reading.reading_type]) {
                latestReadings[reading.reading_type] = reading;
              }
              if (!readingsByType[reading.reading_type]) {
                readingsByType[reading.reading_type] = [];
              }
              readingsByType[reading.reading_type].push(reading);
            });

            checkAlerts(device, latestReadings);

            return {
              device,
              latestReadings,
              historicalData: readings || [],
            };
          })
        );

        setDevices(devicesWithData);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = (device: Device, readings: Record<string, SensorReading>) => {
    const newAlerts: string[] = [];

    if (readings.water_level) {
      const level = readings.water_level.value;
      if (level < 20) {
        newAlerts.push(`${device.device_name}: Low water level (${level}%)`);
      } else if (level > 95) {
        newAlerts.push(`${device.device_name}: Tank nearly full (${level}%)`);
      }
    }

    if (readings.flow_rate) {
      const flow = readings.flow_rate.value;
      if (flow > 100) {
        newAlerts.push(`${device.device_name}: High flow rate detected (${flow} L/min)`);
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...new Set([...prev, ...newAlerts])]);
    }
  };

  const addDevice = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase.from('iot_devices').insert({
        user_id: session.session.user.id,
        device_name: newDevice.device_name,
        device_id: newDevice.device_id,
        device_type: newDevice.device_type,
        status: 'active',
        metadata: { location: newDevice.location },
      });

      if (!error) {
        setShowAddDevice(false);
        setNewDevice({ device_name: '', device_id: '', device_type: 'water_level', location: '' });
        loadDevices();
      }
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const generateDemoData = async (deviceId: string) => {
    try {
      const now = new Date();
      const readings = [];

      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 3600000);

        readings.push({
          device_id: deviceId,
          reading_type: 'water_level',
          value: Math.random() * 40 + 30,
          unit: '%',
          timestamp: timestamp.toISOString(),
        });

        readings.push({
          device_id: deviceId,
          reading_type: 'flow_rate',
          value: Math.random() * 20 + 5,
          unit: 'L/min',
          timestamp: timestamp.toISOString(),
        });

        readings.push({
          device_id: deviceId,
          reading_type: 'temperature',
          value: Math.random() * 10 + 20,
          unit: '°C',
          timestamp: timestamp.toISOString(),
        });
      }

      await supabase.from('sensor_readings').insert(readings);
      loadDevices();
    } catch (error) {
      console.error('Error generating demo data:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'water_level':
        return <Droplet className="w-6 h-6" />;
      case 'flow_meter':
        return <Gauge className="w-6 h-6" />;
      case 'temperature':
        return <ThermometerSun className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const formatChartData = (readings: SensorReading[]) => {
    return readings
      .slice(0, 24)
      .reverse()
      .map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: reading.value,
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedDeviceData = devices.find(d => d.device.id === selectedDevice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">IoT Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring of your rainwater harvesting system</p>
          </div>
          <button
            onClick={() => setShowAddDevice(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">Active Alerts</h3>
                <ul className="space-y-1">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="text-sm text-orange-800">{alert}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setAlerts([])}
                className="text-orange-600 hover:text-orange-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {devices.map(({ device, latestReadings }) => {
            const isOnline = device.last_reading_at
              ? new Date().getTime() - new Date(device.last_reading_at).getTime() < 300000
              : false;

            return (
              <div
                key={device.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedDevice(device.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      isOnline ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getDeviceIcon(device.device_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
                      <p className="text-sm text-gray-500">{device.device_id}</p>
                    </div>
                  </div>
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {device.metadata?.location && (
                  <p className="text-sm text-gray-600 mb-4">{device.metadata.location}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {latestReadings.water_level && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Water Level</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {latestReadings.water_level.value.toFixed(0)}%
                      </p>
                    </div>
                  )}
                  {latestReadings.flow_rate && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Flow Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {latestReadings.flow_rate.value.toFixed(1)}
                        <span className="text-sm ml-1">L/min</span>
                      </p>
                    </div>
                  )}
                  {latestReadings.temperature && (
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Temperature</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {latestReadings.temperature.value.toFixed(1)}°C
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateDemoData(device.id);
                  }}
                  className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Generate Demo Data
                </button>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center shadow-lg">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No devices yet</h3>
              <p className="text-gray-600 mb-6">Add your first IoT device to start monitoring</p>
              <button
                onClick={() => setShowAddDevice(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add Device
              </button>
            </div>
          )}
        </div>

        {selectedDeviceData && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDeviceData.device.device_name} - Historical Data
              </h2>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-8">
              {Object.entries(
                selectedDeviceData.historicalData.reduce((acc, reading) => {
                  if (!acc[reading.reading_type]) acc[reading.reading_type] = [];
                  acc[reading.reading_type].push(reading);
                  return acc;
                }, {} as Record<string, SensorReading[]>)
              ).map(([type, readings]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {type.replace('_', ' ')} - Last 24 Hours
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={formatChartData(readings)}>
                      <defs>
                        <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill={`url(#gradient-${type})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Device</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={newDevice.device_name}
                    onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Main Tank Sensor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID
                  </label>
                  <input
                    type="text"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., TANK-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Type
                  </label>
                  <select
                    value={newDevice.device_type}
                    onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="water_level">Water Level Sensor</option>
                    <option value="flow_meter">Flow Meter</option>
                    <option value="temperature">Temperature Sensor</option>
                    <option value="quality">Water Quality Sensor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Rooftop Tank"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAddDevice(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addDevice}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
