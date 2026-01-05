import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Users, FileCheck, TrendingUp, MapPin, CheckCircle, Clock, XCircle, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Installation {
  id: string;
  address: string;
  system_type: string;
  tank_capacity: number;
  status: string;
  compliance_status: string;
  annual_water_saved: number;
  installation_date: string;
  latitude: number;
  longitude: number;
}

interface Application {
  id: string;
  application_type: string;
  status: string;
  submitted_at: string;
  amount_requested: number;
  amount_approved: number;
  user_id: string;
}

interface DashboardStats {
  totalInstallations: number;
  activeInstallations: number;
  pendingApplications: number;
  totalWaterSaved: number;
  complianceRate: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function GovernmentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInstallations: 0,
    activeInstallations: 0,
    pendingApplications: 0,
    totalWaterSaved: 0,
    complianceRate: 0,
  });
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'installations' | 'applications'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: installationsData } = await supabase
        .from('installation_registry')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: applicationsData } = await supabase
        .from('subsidy_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (installationsData) {
        setInstallations(installationsData);

        const totalWaterSaved = installationsData.reduce((sum, inst) => sum + (inst.annual_water_saved || 0), 0);
        const compliantCount = installationsData.filter(inst => inst.compliance_status === 'compliant').length;

        setStats({
          totalInstallations: installationsData.length,
          activeInstallations: installationsData.filter(inst => inst.status === 'active').length,
          pendingApplications: applicationsData?.filter(app => app.status === 'pending').length || 0,
          totalWaterSaved: totalWaterSaved,
          complianceRate: installationsData.length > 0 ? (compliantCount / installationsData.length) * 100 : 0,
        });
      }

      if (applicationsData) {
        setApplications(applicationsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject', amountApproved?: number) => {
    try {
      const { error } = await supabase
        .from('subsidy_applications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          amount_approved: action === 'approve' ? amountApproved : 0,
        })
        .eq('id', applicationId);

      if (!error) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const getStatusByType = () => {
    const statusCount = installations.reduce((acc, inst) => {
      acc[inst.status] = (acc[inst.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const getApplicationsByMonth = () => {
    const monthlyData: Record<string, number> = {};
    applications.forEach(app => {
      const month = new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  };

  const exportReport = () => {
    const csvContent = [
      ['Address', 'System Type', 'Capacity (L)', 'Status', 'Compliance', 'Water Saved (L/year)'],
      ...installations.map(inst => [
        inst.address,
        inst.system_type,
        inst.tank_capacity,
        inst.status,
        inst.compliance_status,
        inst.annual_water_saved || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rtrwh-installations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Government Integration Suite</h1>
          <p className="text-gray-600">Monitor and manage RTRWH installations across your jurisdiction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Installations</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalInstallations}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Systems</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeInstallations}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Pending Applications</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Water Saved (Annual)</p>
            <p className="text-3xl font-bold text-gray-900">{(stats.totalWaterSaved / 1000).toFixed(1)}k L</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Compliance Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.complianceRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('installations')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'installations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Installations
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Applications
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Installation Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getStatusByType()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getStatusByType().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Applications Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getApplicationsByMonth()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={exportReport}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Export Report
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'installations' && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Address</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">System Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Capacity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Compliance</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Water Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installations
                        .filter(inst => filterStatus === 'all' || inst.status === filterStatus)
                        .map((installation) => (
                          <tr key={installation.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {installation.address}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{installation.system_type}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{installation.tank_capacity.toLocaleString()} L</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                installation.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : installation.status === 'planned'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {installation.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                installation.compliance_status === 'compliant'
                                  ? 'bg-green-100 text-green-800'
                                  : installation.compliance_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {installation.compliance_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {installation.annual_water_saved?.toLocaleString() || 0} L/year
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications
                  .filter(app => app.status === 'pending')
                  .map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              {application.status}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(application.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {application.application_type.replace(/_/g, ' ').toUpperCase()}
                          </h4>
                          <p className="text-gray-600 mb-4">
                            Requested Amount: ₹{application.amount_requested.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approve', application.amount_requested)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {applications.filter(app => app.status === 'pending').length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending applications</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
