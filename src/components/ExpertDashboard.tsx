import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, MapPin, User, FileText, ClipboardCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Type definition matching the database
interface Appointment {
  id: string;
  full_name: string;
  mobile: string;
  address: string;
  city: string;
  pincode: string;
  property_type: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'verified' | 'completed';
  verified_roof_area?: number;
  open_space_available?: boolean;
  existing_rwh?: boolean;
  feasibility?: string;
  recommended_structure?: string;
  estimated_cost?: number;
  expert_remarks?: string;
}

export default function ExpertDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchId, setSearchId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    // Fetch pending and verified appointments
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAppointments(data);
    if (error) console.error("Error fetching:", error);
    setLoading(false);
  };

  const handleSearch = () => {
    if (!searchId.trim()) {
      fetchAppointments(); // Reset if empty
      return;
    }
    const found = appointments.find(a => a.id.toLowerCase().includes(searchId.toLowerCase()));
    if (found) setSelectedAppointment(found);
    else alert("Appointment ID not found in local list. Try refreshing.");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    // Update the database with Expert Data
    const { error } = await supabase
      .from('appointments')
      .update({
        verified_roof_area: selectedAppointment.verified_roof_area,
        open_space_available: selectedAppointment.open_space_available,
        existing_rwh: selectedAppointment.existing_rwh,
        feasibility: selectedAppointment.feasibility,
        recommended_structure: selectedAppointment.recommended_structure,
        estimated_cost: selectedAppointment.estimated_cost,
        expert_remarks: selectedAppointment.expert_remarks,
        status: 'verified' // Change status to Verified
      })
      .eq('id', selectedAppointment.id);

    if (!error) {
      alert("✅ Assessment Verified Successfully!");
      fetchAppointments();
      setSelectedAppointment(null);
    } else {
      alert("❌ Error saving data: " + error.message);
    }
  };

  // --- Detailed View (Verification & Input) ---
  if (selectedAppointment) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button 
          onClick={() => setSelectedAppointment(null)}
          className="mb-6 text-gray-500 hover:text-gray-900 flex items-center gap-2 font-medium"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Verification Card (Read Only) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-fit overflow-hidden">
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" /> Verification Card
              </h2>
              <p className="text-blue-100 text-sm">Verify these details onsite</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">Appointment ID</p>
                <p className="text-2xl font-mono font-bold text-gray-800">{selectedAppointment.id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Applicant</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {selectedAppointment.full_name}
                  </p>
                  <p className="text-sm text-gray-600 pl-6">{selectedAppointment.mobile}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                  <p className="font-medium text-gray-900 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <span className="flex-1">{selectedAppointment.address}, {selectedAppointment.city} - {selectedAppointment.pincode}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
                    <p className="font-medium text-gray-900">{selectedAppointment.preferred_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Slot</p>
                    <p className="font-medium text-gray-900">{selectedAppointment.preferred_time}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                 <div className="flex items-center gap-3 text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Verify ID matches user present onsite</span>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Expert Input Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
              <FileText className="w-6 h-6 text-teal-600" /> On-Spot Assessment Report
            </h2>

            <form onSubmit={handleVerifySubmit} className="space-y-8">
              {/* Technical Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Verified Roof Area (m²)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Measured onsite"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={selectedAppointment.verified_roof_area || ''}
                    onChange={e => setSelectedAppointment({...selectedAppointment, verified_roof_area: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Feasibility Rating</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={selectedAppointment.feasibility || 'High'}
                    onChange={e => setSelectedAppointment({...selectedAppointment, feasibility: e.target.value})}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                    <option>Not Feasible</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                      checked={selectedAppointment.open_space_available || false}
                      onChange={e => setSelectedAppointment({...selectedAppointment, open_space_available: e.target.checked})}
                    />
                    <span className="font-medium text-gray-700">Open Space Available</span>
                 </label>
                 
                 <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                      checked={selectedAppointment.existing_rwh || false}
                      onChange={e => setSelectedAppointment({...selectedAppointment, existing_rwh: e.target.checked})}
                    />
                    <span className="font-medium text-gray-700">Existing RWH Structure</span>
                 </label>
              </div>

              {/* Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Recommended Structure</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                    value={selectedAppointment.recommended_structure || 'Recharge Pit'}
                    onChange={e => setSelectedAppointment({...selectedAppointment, recommended_structure: e.target.value})}
                  >
                    <option>Recharge Pit</option>
                    <option>Recharge Trench</option>
                    <option>Tube Well Recharge</option>
                    <option>Storage Tank (Surface)</option>
                    <option>Storage Tank (Underground)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Cost (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={selectedAppointment.estimated_cost || ''}
                    onChange={e => setSelectedAppointment({...selectedAppointment, estimated_cost: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Expert Remarks</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Notes on soil condition, pipe routing, accessibility, etc..."
                  value={selectedAppointment.expert_remarks || ''}
                  onChange={e => setSelectedAppointment({...selectedAppointment, expert_remarks: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-teal-600 text-white rounded-lg font-bold shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Submit Verified Report
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Dashboard List View ---
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
             <h2 className="text-3xl font-bold text-gray-900">Expert Dashboard</h2>
             <p className="text-gray-500 mt-1">Manage and verify field assessments</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search Appointment ID..." 
                 className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 value={searchId}
                 onChange={e => setSearchId(e.target.value)}
               />
            </div>
            <button 
              onClick={handleSearch}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 text-sm uppercase tracking-wider">
           <div className="col-span-3">Applicant</div>
           <div className="col-span-2">Date & Time</div>
           <div className="col-span-3">Location</div>
           <div className="col-span-2 text-center">Status</div>
           <div className="col-span-2 text-right">Action</div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No appointments found.</div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 items-center hover:bg-blue-50/30 transition-colors">
               <div className="col-span-3">
                 <p className="font-bold text-gray-900">{apt.full_name}</p>
                 <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono border border-gray-200">
                   {apt.id}
                 </span>
               </div>
               <div className="col-span-2 text-sm text-gray-600">
                 <div className="flex items-center gap-2 font-medium text-gray-900 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" /> {apt.preferred_date}
                 </div>
                 <div className="pl-6 text-gray-500 text-xs">{apt.preferred_time}</div>
               </div>
               <div className="col-span-3 text-sm text-gray-600 truncate pr-4">
                 <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-gray-400" /> {apt.city}
                 </div>
                 <span className="text-xs text-gray-400">{apt.property_type}</span>
               </div>
               <div className="col-span-2 text-center">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                   apt.status === 'verified' 
                     ? 'bg-green-100 text-green-700 border-green-200' 
                     : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                 }`}>
                   {apt.status === 'verified' ? 'VERIFIED' : 'PENDING'}
                 </span>
               </div>
               <div className="col-span-2 text-right">
                 <button 
                   onClick={() => setSelectedAppointment(apt)}
                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                 >
                   {apt.status === 'verified' ? 'Edit' : 'Verify'}
                 </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}