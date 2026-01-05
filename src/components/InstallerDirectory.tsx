import { useEffect, useState } from "react";
import { Globe, Phone, MapPin, Star } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Installer {
  id: number;
  business_name: string;
  phone: string;
  experience_years: number;
  city: string;
  website?: string;
  contact_person?: string;
  email?: string;
}

export default function InstallerDirectory({
  currentCity,
}: {
  currentCity: string;
}) {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for new installers
  const [newInstaller, setNewInstaller] = useState({
    business_name: "",
    phone: "",
    city: "",
    website: "",
    contact_person: "",
    email: "",
  });
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    async function fetchInstallers() {
      setLoading(true);
      // Fetch only VERIFIED installers for the specific city
      const { data } = await supabase
        .from("installers")
        .select("*")
        .eq("city", currentCity)
        .eq("is_verified", true)
        .order("experience_years", { ascending: false });

      if (data) setInstallers(data);
      setLoading(false);
    }

    if (currentCity) fetchInstallers();
  }, [currentCity]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("installers").insert([
      {
        business_name: newInstaller.business_name,
        phone: newInstaller.phone,
        city: newInstaller.city,
        contact_person: newInstaller.contact_person || null,
        email: newInstaller.email || null,
        website: newInstaller.website || null,
        is_verified: false, // Default to false so you can vet them later
      },
    ]);

    if (error) setFormStatus("Error submitting. Try again.");
    else {
      setFormStatus("Registration successful! We will verify you shortly.");
      setNewInstaller({
        business_name: "",
        phone: "",
        city: "",
        website: "",
        contact_person: "",
        email: "",
      });
    }
  };

  return (
    <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">
        Find an Expert in {currentCity}
      </h2>

      {/* LIST SECTION */}
      {loading ? (
        <p className="text-gray-600">Loading experts...</p>
      ) : installers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {installers.map((pro) => (
            <div
              key={pro.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition overflow-hidden"
            >
              {/* Header with name and experience */}
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-4 text-white">
                <h3 className="font-bold text-lg mb-1">{pro.business_name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-300" />
                  <span className="text-sm">
                    {pro.experience_years} Years Experience
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                {pro.contact_person && (
                  <p className="text-sm text-gray-700">
                    <strong>Contact Person:</strong> {pro.contact_person}
                  </p>
                )}

                {/* Phone */}
                <a
                  href={`tel:${pro.phone}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {pro.phone}
                </a>

                {/* Email */}
                {pro.email && (
                  <a
                    href={`mailto:${pro.email}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    <span>✉️</span>
                    {pro.email}
                  </a>
                )}

                {/* Website */}
                {pro.website && (
                  <a
                    href={pro.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                  </a>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  {pro.city}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="border-t border-gray-200 p-4 flex gap-2">
                <a
                  href={`tel:${pro.phone}`}
                  className="flex-1 text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition"
                >
                  Call Now
                </a>
                {pro.website && (
                  <a
                    href={pro.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium transition"
                  >
                    Learn More
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg border border-dashed border-gray-300 mb-8">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">
            No verified installers found in {currentCity} yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Be the first to register!
          </p>
        </div>
      )}

      {/* REGISTRATION FORM SECTION */}
      <div className="border-t border-blue-200 pt-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Are you an installer? Join our network
        </h3>
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Business Name *"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.business_name}
              onChange={(e) =>
                setNewInstaller({
                  ...newInstaller,
                  business_name: e.target.value,
                })
              }
              required
            />
            <input
              placeholder="Contact Person"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.contact_person}
              onChange={(e) =>
                setNewInstaller({
                  ...newInstaller,
                  contact_person: e.target.value,
                })
              }
            />
            <input
              placeholder="Phone Number *"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.phone}
              onChange={(e) =>
                setNewInstaller({ ...newInstaller, phone: e.target.value })
              }
              required
            />
            <input
              placeholder="Email"
              type="email"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.email}
              onChange={(e) =>
                setNewInstaller({ ...newInstaller, email: e.target.value })
              }
            />
            <input
              placeholder="City *"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.city}
              onChange={(e) =>
                setNewInstaller({ ...newInstaller, city: e.target.value })
              }
              required
            />
            <input
              placeholder="Website (https://...)"
              type="url"
              className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              value={newInstaller.website}
              onChange={(e) =>
                setNewInstaller({ ...newInstaller, website: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition"
          >
            Register as Installer
          </button>
        </form>
        {formStatus && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            ✓ {formStatus}
          </p>
        )}
      </div>
    </div>
  );
}
