import React, { useState } from "react";
import { Hospital } from "../types";
import { API_BASE } from "../lib/api";
import { AlertCircle, Phone, Heart, Users, Calendar, Sparkles } from "lucide-react";

interface SOSRequestFormProps {
  hospitals: Hospital[];
  onSuccess: () => void;
  lang: 'en' | 'ur';
}

export default function SOSRequestForm({ hospitals, onSuccess, lang }: SOSRequestFormProps) {
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O-");
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospitalId, setHospitalId] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<'Immediate (SOS)' | 'Urgent' | 'Routine'>("Immediate (SOS)");
  const [city, setCity] = useState<'Rawalpindi' | 'Islamabad'>("Islamabad");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !contactPhone || !hospitalId) {
      setError(lang === 'en' ? "Please fill in all required fields." : "برائے مہربانی تمام نشان زدہ فیلڈز مکمل کریں۔");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/emergencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          bloodGroup,
          unitsNeeded,
          hospitalId,
          contactPhone,
          reason,
          urgency,
          city
        })
      });

      if (response.ok) {
        // Clear form
        setPatientName("");
        setContactPhone("");
        setReason("");
        setUnitsNeeded(1);
        onSuccess();
      } else {
        const d = await response.json();
        setError(d.error || "Failed to submit request.");
      }
    } catch (e) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="sos-request-form-card" className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 animate-pulse shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-sans font-bold text-slate-900">
            {lang === 'en' ? 'Launch SOS Emergency Request' : 'فوری ہنگامی بلڈ کی درخواست'}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {lang === 'en' ? 'Broadcasts instantly to all compatible donors in Rawalpindi & Islamabad' : 'راولپنڈی اور اسلام آباد کے عطیہ دہندگان کو فوری مطلع کریں'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Patient Name *' : 'مریض کا نام *'}
            </label>
            <input
              id="input-sos-patient-name"
              type="text"
              required
              placeholder="e.g. Muhammad Zubair"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            />
          </div>

          {/* Contact phone */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Contact Mobile No. *' : 'رابطہ نمبر *'}
            </label>
            <input
              id="input-sos-phone"
              type="tel"
              required
              placeholder="e.g. +92 333 9998822"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Blood group */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Blood Group' : 'خون کا گروپ'}
            </label>
            <select
              id="select-sos-blood-group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            >
              <option value="O-">O- (Universal)</option>
              <option value="O+">O+</option>
              <option value="A-">A-</option>
              <option value="A+">A+</option>
              <option value="B-">B-</option>
              <option value="B+">B+</option>
              <option value="AB-">AB-</option>
              <option value="AB+">AB+</option>
            </select>
          </div>

          {/* Units */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Units Count' : 'بیکر / بوتلیں'}
            </label>
            <input
              id="input-sos-units"
              type="number"
              min="1"
              max="10"
              value={unitsNeeded}
              onChange={(e) => setUnitsNeeded(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            />
          </div>

          {/* Region City */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Target City' : 'شہر'}
            </label>
            <select
              id="select-sos-city"
              value={city}
              onChange={(e) => setCity(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            >
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
              {lang === 'en' ? 'Urgency' : 'شدت'}
            </label>
            <select
              id="select-sos-urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
            >
              <option value="Immediate (SOS)">Immediate (SOS)</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
            </select>
          </div>
        </div>

        {/* Hospital Address selector */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
            {lang === 'en' ? 'Target Islamabad/Rawalpindi Hospital *' : 'ہسپتال کا انتخاب *'}
          </label>
          <select
            id="select-sos-hospital"
            required
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans"
          >
            <option value="">-- Select Target Medical Center --</option>
            {hospitals
              .filter(h => h.city === city)
              .map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city})
                </option>
              ))}
          </select>
        </div>

        {/* Description / Medical detail reason */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5 font-sans">
            {lang === 'en' ? 'Reason / Diagnosis details' : 'علاج / تشخیص کی تفصیل'}
          </label>
          <textarea
            id="input-sos-reason"
            rows={2}
            placeholder="e.g. Major surgery scheduled tomorrow morning. Needs platelets urgently"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition font-sans resize-none"
          />
        </div>

        <button
          id="btn-submit-sos-request"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-sans font-bold text-center tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md shadow-rose-100"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {lang === 'en' ? 'BROADCAST SOS ALERT' : 'ایس او ایس الرٹ نشر کریں'}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
