import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  ArrowLeft, 
  History, 
  Plus, 
  ClipboardCheck, 
  AlertCircle,
  FileDown 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssessmentBookingProps {
  userId?: string;
  onComplete: () => void;
}

interface Appointment {
  id: string;
  created_at: string;
  full_name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  property_type: string;
  status: 'pending' | 'verified' | 'completed';
  preferred_date: string;
  preferred_time: string;
  verified_roof_area?: number;
  recommended_structure?: string;
  expert_remarks?: string;
  feasibility?: string;
  estimated_cost?: number;
}

export default function AssessmentBooking({ userId, onComplete }: AssessmentBookingProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    propertyType: 'Independent House',
    preferredDate: '',
    preferredTime: 'Morning (9AM - 12PM)',
    consent: false
  });

  // Fetch Appointment History for the logged-in user
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setFetching(false);
        setShowForm(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
        
        // If no history exists, go straight to form
        if (!data || data.length === 0) {
          setShowForm(true);
        }
      } catch (err) {
        console.error("History fetch error:", err);
        setShowForm(true);
      } finally {
        setFetching(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const generateAppointmentId = () => {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `VAR-${yy}${mm}${dd}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) return alert("Please provide consent to proceed.");
    
    setLoading(true);
    const appointmentId = generateAppointmentId();

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          id: appointmentId,
          user_id: userId || null,
          full_name: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          property_type: formData.propertyType,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          status: 'pending'
        });

      if (error) throw error;
      setSuccessId(appointmentId);
    } catch (error: any) {
      console.error("Booking Error:", error);
      alert(`Booking Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Logic to Generate and Download PDF Report via Print Dialog
  const handleDownloadPDF = (apt: Appointment) => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Assessment Report - ${apt.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1e3a8a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .id { font-family: monospace; font-weight: bold; color: #4b5563; font-size: 1.1em; }
            .section { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; }
            .section-title { font-weight: 800; font-size: 1.1em; color: #2563eb; text-transform: uppercase; margin-bottom: 15px; display: block; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { display: flex; flex-direction: column; }
            .label { font-size: 0.8em; font-weight: bold; color: #6b7280; text-transform: uppercase; }
            .value { font-size: 1em; color: #111827; }
            .footer { margin-top: 60px; font-size: 0.8em; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .status-badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 9999px; font-weight: bold; font-size: 0.9em; }
            @media print {
              body { padding: 0; }
              .section { border: 1px solid #eee; background: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VARUN - Assessment Report</h1>
            <p class="id">ID: ${apt.id}</p>
            <p>Report Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <span class="section-title">Site & Applicant Details</span>
            <div class="grid">
              <div class="field"><span class="label">Name</span><span class="value">${apt.full_name}</span></div>
              <div class="field"><span class="label">Mobile</span><span class="value">${apt.mobile}</span></div>
              <div class="field"><span class="label">Email</span><span class="value">${apt.email}</span></div>
              <div class="field"><span class="label">Property Type</span><span class="value">${apt.property_type}</span></div>
              <div class="field" style="grid-column: span 2;"><span class="label">Address</span><span class="value">${apt.address}, ${apt.city} - ${apt.pincode}</span></div>
            </div>
          </div>

          <div class="section">
            <span class="section-title">Technical Assessment Results</span>
            <div class="grid">
              <div class="field"><span class="label">Verification Status</span><span class="value"><span class="status-badge">VERIFIED</span></span></div>
              <div class="field"><span class="label">Verified Roof Area</span><span class="value">${apt.verified_roof_area} m²</span></div>
              <div class="field"><span class="label">Feasibility</span><span class="value">${apt.feasibility || 'High'}</span></div>
              <div class="field"><span class="label">Recommended Structure</span><span class="value">${apt.recommended_structure}</span></div>
              <div class="field"><span class="label">Estimated Project Cost</span><span class="value">₹${apt.estimated_cost?.toLocaleString() || 'N/A'}</span></div>
              <div class="field"><span class="label">Assessment Date</span><span class="value">${apt.preferred_date}</span></div>
            </div>
          </div>

          <div class="section">
            <span class="section-title">Expert Remarks</span>
            <p class="value">${apt.expert_remarks || 'The site has been inspected and found suitable for rooftop rainwater harvesting. The recommended structure has been suggested based on local soil conditions and rooftop area.'}</p>
          </div>

          <div class="footer">
            <p>This is a computer-generated report based on on-spot field verification.</p>
            <p>Varun Project - Smart India Hackathon 2024</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Fetching your records...</p>
      </div>
    );
  }

  // --- Success Screen ---
  if (successId) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-10 text-center mt-10 border border-gray-100">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-8">We've received your request. You can track this appointment in your history panel.</p>
        
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-teal-400" />
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-2">Appointment Identifier</p>
          <p className="text-4xl font-mono font-bold text-gray-800 tracking-wider select-all">{successId}</p>
        </div>

        <button 
          onClick={onComplete}
          className="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // --- History List View ---
  if (!showForm && history.length > 0) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <History className="w-10 h-10 text-blue-600" /> Assessment History
            </h2>
            <p className="text-gray-500 text-lg">View status and download verified field reports.</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <Plus className="w-5 h-5" /> Schedule New Visit
          </button>
        </div>

        <div className="grid gap-6">
          {history.map((apt) => (
            <motion.div 
              key={apt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 space-y-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-700 font-mono font-bold text-sm rounded-xl border border-gray-200">
                      {apt.id}
                    </span>
                    <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-tight border shadow-sm ${
                      apt.status === 'verified' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {apt.status === 'verified' ? <ClipboardCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {apt.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Date</p>
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <Calendar className="w-4 h-4 text-blue-500" /> {apt.preferred_date}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Slot</p>
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <Clock className="w-4 h-4 text-blue-500" /> {apt.preferred_time}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Type</p>
                      <div className="flex items-center gap-2 text-gray-900 font-semibold uppercase text-sm">
                        <MapPin className="w-4 h-4 text-blue-500" /> {apt.property_type}
                      </div>
                    </div>
                  </div>
                </div>

                {apt.status === 'verified' && (
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-stretch lg:w-72">
                    <div className="bg-green-50/60 p-5 rounded-2xl border border-green-100 flex-1">
                      <p className="text-[10px] text-green-700 font-black uppercase tracking-tighter mb-2">Verified Measurements</p>
                      <div className="space-y-1.5">
                         <div className="flex justify-between text-sm"><span className="text-gray-500">Roof Area:</span> <span className="font-bold text-green-800">{apt.verified_roof_area} m²</span></div>
                         <div className="flex justify-between text-sm"><span className="text-gray-500">Rec. Unit:</span> <span className="font-bold text-green-800 truncate pl-2">{apt.recommended_structure}</span></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadPDF(apt)}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-md group-hover:scale-[1.02]"
                    >
                      <FileDown className="w-5 h-5" /> Download Report
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={onComplete}
          className="mt-12 text-gray-400 hover:text-gray-900 flex items-center gap-2 font-bold transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>
      </div>
    );
  }

  // --- Booking Form View ---
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={history.length > 0 ? () => setShowForm(false) : onComplete}
          className="flex items-center text-gray-500 hover:text-blue-600 transition-all font-bold group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> {history.length > 0 ? 'Back to History' : 'Cancel'}
        </button>
        {history.length > 0 && (
          <button 
            onClick={() => setShowForm(false)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100"
          >
            <History className="w-4 h-4" /> Show Past Bookings
          </button>
        )}
      </div>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">On-Spot Assessment</h2>
        <p className="text-gray-500 text-lg mt-2">Schedule a certified expert visit to your site for technical verification.</p>
      </div>

      <motion.form 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-10 md:p-12 relative"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* User Details */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
              Applicant Identity
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input required type="text" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter your full name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="tel" pattern="[0-9]{10}" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="10 Digits" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required type="email" className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="name@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site Details */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-teal-600" /></div>
              Site Location
            </h3>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Physical Address</label>
                <textarea required rows={2} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition-all resize-none" placeholder="House/Plot No, Street name, Landmark" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                  <input required type="text" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition-all" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                  <input required type="text" pattern="[0-9]{6}" maxLength={6} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition-all" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Property Categorization</label>
                <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 transition-all appearance-none" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})} >
                  <option>Independent House</option>
                  <option>Apartment Complex</option>
                  <option>Commercial Hub</option>
                  <option>Industrial Plant</option>
                  <option>Educational Campus</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-[2rem] p-8 mb-10 border border-blue-50/50">
           <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" /> Appointment Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Date</label>
                <input required type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-5 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" value={formData.preferredDate} onChange={e => setFormData({...formData, preferredDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Preferred Time Slot</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select className="w-full pl-12 pr-5 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none shadow-sm" value={formData.preferredTime} onChange={e => setFormData({...formData, preferredTime: e.target.value})} >
                    <option>Morning (9 AM - 12 PM)</option>
                    <option>Afternoon (12 PM - 3 PM)</option>
                    <option>Evening (3 PM - 6 PM)</option>
                  </select>
                </div>
              </div>
            </div>
        </div>

        {/* Consent */}
        <div className="flex items-start gap-4 mb-10 bg-blue-600/5 p-6 rounded-2xl border border-blue-100/50">
          <div className="mt-1">
            <input 
              type="checkbox" 
              id="consent" 
              required
              checked={formData.consent} 
              onChange={e => setFormData({...formData, consent: e.target.checked})} 
              className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-none bg-white shadow-sm" 
            />
          </div>
          <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed cursor-pointer font-medium">
            I certify that the provided information is accurate and I authorize a field expert visit for technical site evaluation.
          </label>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-5">
          <button 
            type="button" 
            onClick={() => history.length > 0 ? setShowForm(false) : onComplete()} 
            className="px-10 py-4 border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 font-bold transition-all order-2 sm:order-1"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || !formData.consent} 
            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 order-1 sm:order-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                Securing Slot...
              </>
            ) : 'Confirm Visit Request'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}