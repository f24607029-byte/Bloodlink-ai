import React, { useState, FormEvent } from "react";
import { Donor } from "../types";
import { API_BASE } from "../lib/api";
import { 
  Search, MapPin, CheckCircle, ShieldAlert, PhoneCall, Award, 
  Calendar, ToggleLeft, ToggleRight, Star, MessageSquare, Send, Sparkles, UserPlus 
} from "lucide-react";

interface DonorSearchProps {
  donors: Donor[];
  lang: 'en' | 'ur';
  onReviewSubmitted: () => void;
  activeTab?: 'search' | 'register';
  setActiveTab?: (tab: 'search' | 'register') => void;
}

export default function DonorSearch({ donors, lang, onReviewSubmitted, activeTab, setActiveTab }: DonorSearchProps) {
  const [bloodFilter, setBloodFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded panel state per individual donor card
  const [expandedDonorReviews, setExpandedDonorReviews] = useState<string | null>(null);

  // Review submission state
  const [patientName, setPatientName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Local Tab state if parent doesn't provide it
  const [localActiveTab, setLocalActiveTab] = useState<'search' | 'register'>('search');
  const currentTab = activeTab !== undefined ? activeTab : localActiveTab;
  const changeTab = setActiveTab !== undefined ? setActiveTab : setLocalActiveTab;

  // New Volunteer Registration state
  const [regName, setRegName] = useState("");
  const [regBlood, setRegBlood] = useState("O-");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("Islamabad");
  const [regLocation, setRegLocation] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState("");

  const handleCall = (donor: Donor) => {
    setCopiedId(donor.id);
    navigator.clipboard.writeText(donor.phone);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleReviewSubmit = async (donorId: string) => {
    if (!patientName.trim() || !comment.trim()) {
      setReviewError(lang === 'en' ? "Please complete all fields" : "براہ کرم تمام خانے پُر کریں");
      return;
    }
    setIsSubmittingReview(true);
    setReviewError("");
    try {
      const response = await fetch(`${API_BASE}/api/donors/${donorId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          rating,
          comment
        })
      });
      
      if (response.ok) {
        setReviewSuccess(lang === 'en' ? "Review successfully posted!" : "رائے کامیابی سے درج کر دی گئی!");
        setPatientName("");
        setComment("");
        setRating(5);
        // Refresh parent state
        onReviewSubmitted();
      } else {
        const data = await response.json();
        setReviewError(data.error || "Failed to post review.");
      }
    } catch (err) {
      setReviewError("Network error. Try again shortly.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRegisterVolunteer = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regLocation.trim()) {
      setRegisterError(lang === 'en' ? "Please complete all fields." : "براہ کرم تمام لازمی خانے پُر کریں۔");
      return;
    }
    
    setIsRegistering(true);
    setRegisterError("");
    setRegisterSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/donors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          bloodGroup: regBlood,
          phone: regPhone,
          city: regCity,
          location: regLocation
        })
      });

      if (response.ok) {
        setRegisterSuccess(lang === 'en' ? "Successfully registered as a savior volunteer! Your live card is now added to the Twin Cities Registry." : "بطور رضاکار خون عطیہ دہندہ کامیابی سے اندراج ہو چکا ہے! آپ کا پروفائل لائیو رجسٹری میں شامل کر دیا گیا ہے۔");
        setRegName("");
        setRegPhone("");
        setRegLocation("");
        setRegBlood("O-");
        // Reload parent data to fetch the new donor in search screen
        onReviewSubmitted();
      } else {
        const data = await response.json();
        setRegisterError(data.error || (lang === 'en' ? "Failed to register. Please try again." : "اندراج ناکام رہا۔ دوبارہ کوشش کریں۔"));
      }
    } catch (err) {
      setRegisterError(lang === 'en' ? "Network/Server error. Please try again." : "سرور میں خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setIsRegistering(false);
    }
  };

  const filtered = donors.filter(donor => {
    if (bloodFilter !== "All" && donor.bloodGroup !== bloodFilter) return false;
    if (cityFilter !== "All" && donor.city !== cityFilter) return false;
    if (availableOnly && !donor.isAvailable) return false;
    return true;
  });

  return (
    <div id="donor-search-module-card" className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base md:text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-rose-600 animate-pulse" />
            {lang === 'en' ? 'Savior Network & Registry' : 'لائیو عطیہ دہندگان کی رجسٹری'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            {lang === 'en' ? 'Verified volunteers in Rawalpindi & Islamabad serving real-time medical needs' : 'راولپنڈی اور اسلام آباد کے تصدیق شدہ رضاکار برائے فوری رابطہ'}
          </p>
        </div>

        {/* Available only switch / Top Actions */}
        {currentTab === 'search' && (
          <button
            id="btn-toggle-available-only"
            onClick={() => setAvailableOnly(!availableOnly)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer self-start md:self-auto"
          >
            {availableOnly ? (
              <ToggleRight className="w-5.5 h-5.5 text-rose-600" />
            ) : (
              <ToggleLeft className="w-5.5 h-5.5 text-slate-400" />
            )}
            <span>{lang === 'en' ? 'Active / Available Only' : 'دستیاب رضاکار'}</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-150 mb-5 text-xs">
        <button
          onClick={() => changeTab('search')}
          id="btn-donor-tab-search"
          className={`flex-1 py-2.5 text-center font-bold font-sans tracking-wide border-b-2 transition-all duration-300 cursor-pointer ${
            currentTab === 'search'
              ? 'border-rose-600 text-rose-600 font-extrabold'
              : 'border-transparent text-slate-505 hover:text-slate-800'
          }`}
        >
          🔍 {lang === 'en' ? 'Search Live Registry' : 'رضاکار تلاش کریں'} ({donors.length})
        </button>
        <button
          onClick={() => changeTab('register')}
          id="btn-donor-tab-register"
          className={`flex-1 py-2.5 text-center font-bold font-sans tracking-wide border-b-2 transition-all duration-300 cursor-pointer ${
            currentTab === 'register'
              ? 'border-rose-600 text-rose-600 font-extrabold'
              : 'border-transparent text-slate-550 hover:text-slate-800'
          }`}
        >
          ✍️ {lang === 'en' ? 'Register As Savior' : 'بطور رضاکار لائیو اندراج'}
        </button>
      </div>

      {currentTab === 'search' ? (
        <>
          {/* Filters Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs">
            {/* Blood group selection */}
            <div>
              <label className="block text-slate-500 font-medium mb-1.5 font-sans">
                {lang === 'en' ? 'Filter Blood Type' : 'بلڈ گروپ منتخب کریں'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["All", "O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(gp => (
                  <button
                    key={gp}
                    onClick={() => setBloodFilter(gp)}
                    id={`btn-filter-blood-${gp}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                      bloodFilter === gp 
                        ? 'bg-rose-605 text-white bg-rose-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {gp}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-slate-500 font-medium mb-1.5 font-sans">
                {lang === 'en' ? 'Filter City' : 'شہر منتخب کریں'}
              </label>
              <div className="flex gap-2">
                {["All", "Islamabad", "Rawalpindi"].map(city => (
                  <button
                    key={city}
                    onClick={() => setCityFilter(city)}
                    id={`btn-filter-city-${city}`}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                      cityFilter === city 
                        ? 'bg-rose-605 text-white bg-rose-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Donors List layout */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  {lang === 'en' ? 'No matching available donors found' : 'کوئی مماثل رضاکار تلاش نہیں کیا جا سکا'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' ? 'Try seeking different blood compatibility or cities' : 'دوسری مطابقت یا دوسرے جڑواں شہر منتخب کریں'}
                </p>
              </div>
            ) : (
              filtered.map((donor) => {
                const reviews = donor.reviews || [];
                const totalReviews = reviews.length;
                const avgRating = totalReviews > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                  : null;

                return (
                  <div 
                    key={donor.id}
                    className="p-4 rounded-xl bg-white border border-slate-250 hover:border-rose-300 hover:shadow-sm transition-all duration-300 flex flex-col gap-4"
                  >
                    {/* Primary row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Big blood marker */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-650 via-rose-600 to-rose-700 shadow shadow-rose-100 flex flex-col items-center justify-center text-white font-sans shrink-0">
                          <span className="text-base font-extrabold leading-none">{donor.bloodGroup}</span>
                          <span className="text-[9px] font-mono tracking-tighter opacity-80 mt-1 uppercase">Twin</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 font-sans tracking-wide">
                              {donor.name}
                            </h4>
                            
                            {/* Average Star Rating Badge */}
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] text-amber-705 font-bold font-sans">
                              <Star className="w-2.5 h-2.5 fill-amber-550 text-amber-500" />
                              <span className="font-semibold">{avgRating ? `${avgRating} (${totalReviews})` : (lang === 'en' ? 'New (0)' : 'نیا (0)')}</span>
                            </div>

                            {donor.isAvailable ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-green-50 border border-green-200 text-green-700">
                                Available
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-slate-100 border border-slate-200 text-slate-500">
                                Busy
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{donor.location}, {donor.city}</span>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {donor.badges.map((badge, bIdx) => (
                              <span 
                                key={bIdx}
                                className="px-2 py-0.5 rounded-md text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-sans tracking-wide flex items-center gap-0.5"
                              >
                                <Award className="w-2.5 h-2.5" />
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions layout (Donations & Reviews toggle & Dial calls) */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        
                        <div className="text-left sm:text-right text-xs max-sm:flex max-sm:items-center max-sm:gap-2 max-sm:w-full">
                          <div className="text-slate-500 font-sans">
                            {lang === 'en' ? 'Donated count:' : 'عطیات تعداد:'} <span className="text-slate-800 font-semibold">{donor.stats?.donationsCount ?? 1} bags</span>
                          </div>
                          <div className="text-slate-500 font-sans">
                            {lang === 'en' ? 'Lives Saved:' : 'بچائی گئی جانیں:'} <span className="text-emerald-600 font-bold">{donor.stats?.livesSaved ?? 1}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto text-xs">
                          {/* Reviews Toggle Button */}
                          <button
                            onClick={() => {
                              if (expandedDonorReviews === donor.id) {
                                setExpandedDonorReviews(null);
                              } else {
                                setExpandedDonorReviews(donor.id);
                                // Reset states
                                setPatientName("");
                                setRating(5);
                                setComment("");
                                setReviewError("");
                                setReviewSuccess(null);
                              }
                            }}
                            className={`flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-bold leading-none border transition duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                              expandedDonorReviews === donor.id 
                                ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Reviews' : 'رائے'} ({totalReviews})</span>
                          </button>

                          {/* Phone call Action */}
                          <button
                            id={`btn-call-donor-${donor.id}`}
                            onClick={() => handleCall(donor)}
                            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs font-bold leading-none bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>
                              {copiedId === donor.id 
                                ? (lang === 'en' ? 'Copied!' : 'کاپی ہو گیا!') 
                                : donor.phone}
                            </span>
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Testimonials drawer */}
                    {expandedDonorReviews === donor.id && (
                      <div className="border-t border-slate-100 pt-3 mt-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-xs text-slate-700 tracking-wide font-sans flex items-center gap-1.5 uppercase">
                            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                            {lang === 'en' ? `Patient testimonials for ${donor.name}` : `مریضوں کی آراء برائے ${donor.name}`}
                          </h5>
                          {avgRating && (
                            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-mono">
                              ⭐ {avgRating} / 5.0 Rating
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Testimonials List */}
                          <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin pr-1">
                            {reviews.length === 0 ? (
                              <div className="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                                <Sparkles className="w-5 h-5 text-slate-350 mx-auto mb-1" />
                                <p className="text-[10px] text-slate-550 font-sans">
                                  {lang === 'en' ? 'No patient ratings yet.' : 'کوئی رائے تاحال درج نہیں کی گئی۔'}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                                  {lang === 'en' ? 'Interact first to leave a 1-5 star review!' : 'عطیہ دہندہ کے ساتھ تعاون کے بعد اس فیڈ بیک کو بھریں!'}
                                </p>
                              </div>
                            ) : (
                              reviews.map((rev) => (
                                <div key={rev.id} className="p-2.5 rounded-lg bg-slate-50/55 border border-slate-200 text-[11px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-slate-800 font-sans">{rev.patientName}</span>
                                    <div className="text-amber-550 flex items-center text-[9px] font-mono">
                                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                      <span className="text-slate-400 font-normal ml-1.5">{rev.date}</span>
                                    </div>
                                  </div>
                                  <p className="text-slate-600 italic leading-relaxed">
                                    "{rev.comment}"
                                  </p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Right: Write testimonial form */}
                          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 relative text-xs">
                            <h6 className="font-bold text-[10px] uppercase tracking-wider text-slate-705 mb-2">
                              {lang === 'en' ? 'Add rating & testimonial' : 'رائے اور ریٹنگ شامل کریں'}
                            </h6>

                            {reviewError && (
                              <p className="p-1.5 mb-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-semibold leading-tight">
                                ⚠️ {reviewError}
                              </p>
                            )}

                            {reviewSuccess ? (
                              <div className="absolute inset-0 bg-emerald-50/95 flex flex-col items-center justify-center p-3 rounded-xl text-center border border-emerald-250">
                                <CheckCircle className="w-7 h-7 text-emerald-600 mb-1.5 animate-bounce" />
                                <p className="text-[11px] font-bold text-emerald-800">{reviewSuccess}</p>
                                <button
                                  onClick={() => setReviewSuccess(null)}
                                  className="mt-2.5 px-3 py-1 bg-white border border-emerald-250 hover:bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg transition cursor-pointer"
                                >
                                  Okay
                                </button>
                              </div>
                            ) : (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleReviewSubmit(donor.id);
                                }} 
                                className="space-y-2"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] uppercase tracking-wide text-slate-500 font-bold mb-0.5">
                                      {lang === 'en' ? 'Patient / Attendant' : 'مریض یا نگران'}
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={patientName}
                                      onChange={(e) => setPatientName(e.target.value)}
                                      placeholder={lang === 'en' ? "Zainab Bibi" : "مثال: زینب بی بی"}
                                      className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] uppercase tracking-wide text-slate-500 font-bold mb-0.5">
                                      {lang === 'en' ? 'Rating' : 'سٹارز ریٹنگ'}
                                    </label>
                                    <div className="flex gap-0.5 items-center mt-0.5">
                                      {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                          type="button"
                                          key={num}
                                          onClick={() => setRating(num)}
                                          className="transition hover:scale-110 cursor-pointer"
                                        >
                                          <Star 
                                            className={`w-3.5 h-3.5 ${
                                              num <= rating 
                                                ? 'text-amber-500 fill-amber-500' 
                                                : 'text-slate-300'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[8px] uppercase tracking-wide text-slate-505 font-bold mb-0.5">
                                    {lang === 'en' ? 'Testimonial / Comment' : 'مختصر تجربہ'}
                                  </label>
                                  <textarea
                                    required
                                    rows={2}
                                    maxLength={160}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={lang === 'en' ? "Prompt response, reached quickly..." : "فوری رابطہ کیا اور بہت مدد کی۔"}
                                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none font-sans"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  disabled={isSubmittingReview}
                                  className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer font-sans shadow-sm"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>
                                    {isSubmittingReview 
                                      ? '...' 
                                      : (lang === 'en' ? 'Submit Feedback' : 'رائے جمع کریں')}
                                  </span>
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* VOLUNTEER REGISTRATION FORM */
        <div className="p-1 text-xs">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-rose-655" />
            <div>
              <h4 className="font-bold text-sm text-slate-850 font-sans">
                {lang === 'en' ? 'Save Lives in Rawalpindi & Islamabad' : 'جڑواں شہروں میں انسانیت کی خدمت کریں'}
              </h4>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                {lang === 'en' ? 'Join over 600 verified local blood donors available for emergencies' : 'ہنگامی حالات کے لیے راولپنڈی اور اسلام آباد کے عطیہ دہندگان میں شامل ہوں'}
              </p>
            </div>
          </div>

          {registerError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
              ⚠️ {registerError}
            </div>
          )}

          {registerSuccess ? (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-605 mx-auto animate-bounce" />
              <h5 className="font-bold text-emerald-900 text-sm">
                {lang === 'en' ? 'Welcome to Savior Network!' : 'رضاکار نیٹ ورک میں خوش آمدید!'}
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                {registerSuccess}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterSuccess(null);
                    changeTab('search');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm cursor-pointer font-sans"
                >
                  {lang === 'en' ? 'View Live Savior List' : 'لائیو فہرست دیکھیں'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterVolunteer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-slate-550 font-bold tracking-wide text-[10px] uppercase mb-1.5">
                    {lang === 'en' ? 'Full Name' : 'عطیہ دہندہ کا نام'} <span className="text-red-505">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={lang === 'en' ? "e.g., Haris Mahmood" : "مثال: حارث محمود"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                  />
                </div>

                {/* Blood Group Selector */}
                <div>
                  <label className="block text-slate-550 font-bold tracking-wide text-[10px] uppercase mb-1.5">
                    {lang === 'en' ? 'Your Blood Group' : 'آپ کا بلڈ گروپ'} <span className="text-red-505">*</span>
                  </label>
                  <select
                    value={regBlood}
                    onChange={(e) => setRegBlood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans font-semibold text-xs"
                  >
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(gp => (
                      <option key={gp} value={gp}>{gp}</option>
                    ))}
                  </select>
                </div>

                {/* Contact phone */}
                <div>
                  <label className="block text-slate-550 font-bold tracking-wide text-[10px] uppercase mb-1.5">
                    {lang === 'en' ? 'Contact Phone (For Patients)' : 'رابطہ نمبر (مریضوں کے لیے)'} <span className="text-red-505">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+92 333 XXXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                {/* Twin Cities Switch */}
                <div>
                  <label className="block text-slate-550 font-bold tracking-wide text-[10px] uppercase mb-1.5">
                    {lang === 'en' ? 'Twin Cities Region' : 'علاقہ / شہر'} <span className="text-red-505">*</span>
                  </label>
                  <div className="flex gap-2">
                    {["Islamabad", "Rawalpindi"].map(city => (
                      <button
                        type="button"
                        key={city}
                        onClick={() => setRegCity(city)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                          regCity === city 
                            ? 'bg-rose-600 text-white shadow shadow-rose-650/30 font-bold' 
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Specific Hospital nearby / Area address */}
              <div>
                <label className="block text-slate-550 font-bold tracking-wide text-[10px] uppercase mb-1.5">
                  {lang === 'en' ? 'Specific Sector / Area Location' : 'مخصوص سیکٹر یا علاقہ کی لوکیشن'} <span className="text-red-505">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  placeholder={lang === 'en' ? "e.g., G-10/4, near PIMS Hospital or Satellite Town" : "مثال: جی 10، نزد پمز ہسپتال یا سیٹلائٹ ٹاؤن"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-red-50/20 border border-red-200/50 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  {lang === 'en' 
                    ? "By submitting, you agree to list your blood type and contact phone so local twin cities hospitals and patient attendants can trace you for blood crisis response."
                    : "اندراج کر کے آپ اس بات سے متفق ہیں کہ آپ کا بلڈ گروپ اور فون نمبر لائیو ڈیٹا بیس پر ظاہر کیا جائے گا تاکہ مریض کے لواحقین ہنگامی حالت میں آپ سے رابطہ کر سکیں۔"}
                </p>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {isRegistering 
                    ? (lang === 'en' ? 'Registering Savior Profile...' : 'اندراج کیا جا رہا ہے...') 
                    : (lang === 'en' ? 'Submit Savior Volunteer Registration' : 'عطیہ دہندہ رجسٹریشن فارم جمع کریں')}
                </span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
