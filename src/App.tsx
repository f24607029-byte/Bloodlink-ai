import { useState, useEffect } from "react";
import { Hospital, BloodCamp, Donor, EmergencyRequest, RealtimeNotification } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Droplets, Building2, Calendar, MapPin, Search, Globe, 
  Bell, Volume2, Award, Users, AlertTriangle, ShieldCheck, Phone, CheckSquare, Sparkles, Activity
} from "lucide-react";

import MapComponent from "./components/MapComponent";
import AIChatbot from "./components/AIChatbot";
import SOSRequestForm from "./components/SOSRequestForm";
import DonorSearch from "./components/DonorSearch";
import StatsDashboard from "./components/StatsDashboard";
import DonorStreakBadge from "./components/DonorStreakBadge";
import MLPlayground from "./components/MLPlayground";

export default function App() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'camps' | 'analytics'>('hospitals');
  
  // Data State
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [camps, setCamps] = useState<BloodCamp[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  
  // User Authentication State (Simulating login of Dr. Safeer)
  const [currentUserDonor, setCurrentUserDonor] = useState<Donor | null>(null);

  // Selection state for Map interactions
  const [selectedItem, setSelectedItem] = useState<Hospital | BloodCamp | null>(null);
  
  // Highlighting active SOS fields from AI chatbot triage cues
  const [flashSOS, setFlashSOS] = useState(false);

  // Separate active subtab for donor registry/registration
  const [activeDonorTab, setActiveDonorTab] = useState<'search' | 'register'>('search');

  // Load all initial state from full-stack REST routes
  const loadData = async () => {
    try {
      const [hospRes, campRes, donorRes, emergRes, notifRes, authRes] = await Promise.all([
        fetch("/api/hospitals"),
        fetch("/api/camps"),
        fetch("/api/donors"),
        fetch("/api/emergencies"),
        fetch("/api/notifications"),
        fetch("/api/auth/me")
      ]);

      if (hospRes.ok) setHospitals(await hospRes.json());
      if (campRes.ok) setCamps(await campRes.json());
      if (donorRes.ok) {
        const dList = await donorRes.json();
        setDonors(dList);
        // Map Safeer Khan as current active donor logged-in state
        const safeer = dList.find((d: Donor) => d.name.includes("Safeer"));
        if (safeer) setCurrentUserDonor(safeer);
      }
      if (emergRes.ok) setEmergencies(await emergRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());

    } catch (e) {
      console.error("Failed to fetch initial application registries: ", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state helpers
  const handleSOSSuccess = () => {
    loadData();
    // Scroll smoothly to emergencies overview or display toast
    const el = document.getElementById("active-emergencies-board");
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCampRegistration = async (campId: string) => {
    try {
      const response = await fetch("/api/camps/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId })
      });
      if (response.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFulfillSOS = async (sosId: string) => {
    try {
      const response = await fetch("/api/emergencies/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sosId })
      });
      if (response.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCurrentUserAvailability = (isAvailable: boolean) => {
    if (currentUserDonor) {
      setCurrentUserDonor({ ...currentUserDonor, isAvailable });
      loadData(); // Synchronize listing
    }
  };

  // AI triggered triage indicator cue
  const handleAIEmergencyTrigger = () => {
    setFlashSOS(true);
    setTimeout(() => setFlashSOS(false), 5000);
    // Auto scroll to SOS form
    const formElement = document.getElementById("sos-request-form-card");
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const readAllNotifications = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Select hospital or camp and highlight it on MapComponent
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    const mapDiv = document.getElementById("leaflet-map-root-card");
    if (mapDiv) mapDiv.scrollIntoView({ behavior: 'smooth' });
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans">
      
      {/* Dynamic Emergency Broadcast banner */}
      {unreadNotifCount > 0 && (
        <div className="bg-gradient-to-r from-red-650 via-rose-700 to-red-650 py-2.5 px-4 flex items-center justify-between text-xs font-sans font-semibold tracking-wide shadow-md gap-3 relative z-40">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertTriangle className="w-4 h-4 text-white shrink-0 animate-bounce" />
            <span className="bg-white text-red-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold tracking-widest label animate-pulse">
              {lang === 'en' ? 'BROADCAST ALERT' : 'ایمرجنسی الرٹ'}
            </span>
            <span className="truncate text-white">
              {notifications.find(n => n.type === 'emergency' && !n.read)?.message || notifications[0].message}
            </span>
          </div>
          <button 
            id="btn-dismiss-broadcast"
            onClick={readAllNotifications}
            className="underline text-white font-bold hover:text-slate-100 transition whitespace-nowrap"
          >
            {lang === 'en' ? 'Acknowledge' : 'تصدیق کریں'}
          </button>
        </div>
      )}

      {/* World-class Navigation Header */}
      <header className="py-4.5 px-6 bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Animated logo */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow shadow-red-200 border border-rose-500 relative">
            <Droplets className="w-5.5 h-5.5 fill-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <span className="text-lg font-black tracking-tighter text-slate-900 font-sans flex items-center gap-1.5 uppercase">
              BloodLink <span className="bg-red-650 text-[10px] font-mono tracking-widest py-0.5 px-1.5 rounded text-white italic">AI</span>
            </span>
            <p className="text-[10px] font-mono text-slate-500 tracking-wider">
              {lang === 'en' ? 'Pakistan’s Intelligent Crisis Response Hub' : 'پاکستان کاسمارٹ کرائسز ریسپانس'}
            </p>
          </div>
        </div>

        {/* Action Controls & Multilingual Toggle */}
        <div className="flex items-center gap-4">
          
          {/* Dr. Safeer Profile Card header indicator */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-slate-700 font-medium font-sans">
              Safeer Khan ({lang === 'en' ? 'O+ Donor Profile' : 'عطیہ دہندہ'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-rose-600" />
            <button
              id="btn-toggle-language"
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-250 text-xs font-semibold hover:border-rose-500 transition duration-300 text-slate-700 uppercase cursor-pointer tracking-wider shadow-sm"
            >
              {lang === 'en' ? 'اردو' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome banner */}
      <section className="py-10 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Onboarding info */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-red-50 border border-rose-200 text-rose-700 font-semibold uppercase tracking-wider self-start flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {lang === 'en' ? 'Rawalpindi & Islamabad Operations Live' : 'راولپنڈی اور اسلام آباد لائیو سروس'}
          </span>
          <h1 className="text-3xl md:text-5xl font-sans font-black tracking-tight text-slate-900 leading-tight">
            {lang === 'en' ? 'Every Second Counts. Find Donors ' : 'ہر سیکنڈ قیمتی ہے۔ خون کا عطیہ '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-650 via-rose-600 to-amber-650">
              {lang === 'en' ? 'Instantly.' : 'فوری تلاش کریں۔'}
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
            {lang === 'en' 
              ? 'BloodLink AI blends state-of-the-art geo-tracking with intelligent medical matching. Broadcast SOS request networks, filter matching donors inside minutes, and coordinate triage support via Gemini.' 
              : 'بلڈ لنک کلاؤڈ نجی اور حکومتی ہسپتالوں کے ڈیٹا بیس کو جوڑتا ہے۔ ایس او ایس الرٹس جاری کریں اور اپنے علاقے میں خون کے لائیو عطیہ دہندگان سے فوری رابطہ کریں۔'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a 
              href="#active-emergencies-board" 
              className="px-5 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-100 transition text-sm cursor-pointer text-white text-center"
            >
              {lang === 'en' ? 'View Live Emergencies' : 'ہنگامی حالات دیکھیں'}
            </a>
            <a 
              href="#volunteer-registries-board" 
              onClick={() => setActiveDonorTab('register')}
              className="px-5 py-3 rounded-xl font-bold bg-white hover:bg-slate-50 transition border border-slate-250 text-slate-705 text-sm cursor-pointer text-center shadow-sm"
            >
              {lang === 'en' ? 'Register As Volunteer' : 'بطور عطیہ دہندہ رجسٹر کریں'}
            </a>
          </div>
        </div>

        {/* Gamified Profile Box quick overview */}
        <div className="lg:col-span-4 justify-self-stretch">
          {currentUserDonor && (
            <DonorStreakBadge 
              donor={currentUserDonor} 
              onToggleAvailability={handleToggleCurrentUserAvailability}
              lang={lang}
            />
          )}
        </div>
      </section>

      {/* MAIN TWO COLUMN LAYOUT CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Map & Directory Listings (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Integrated Leaflet Islamabad/Rawalpindi map component */}
          <MapComponent 
            hospitals={hospitals} 
            camps={camps} 
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            lang={lang}
          />

          {/* Directory Panels tabs selection toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            
            {/* Nav Tab keys */}
            <div className="flex border-b border-slate-150 bg-slate-50/50 p-1">
              <button
                id="tab-hospitals"
                onClick={() => { setActiveTab('hospitals'); setSelectedItem(null); }}
                className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'hospitals' 
                    ? 'bg-white text-rose-650 shadow-sm border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'en' ? 'Twin Cities Hospitals' : 'راولپنڈی و اسلام آباد ہسپتال'}
              </button>
              <button
                id="tab-camps"
                onClick={() => { setActiveTab('camps'); setSelectedItem(null); }}
                className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'camps' 
                    ? 'bg-white text-rose-650 shadow-sm border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'en' ? 'Upcoming Blood Camps' : 'خون عطیہ مہم کے کیمپ'}
              </button>
              <button
                id="tab-analytics"
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-white text-rose-650 shadow-sm border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'en' ? 'Database Statistics' : 'ڈیٹا بیس کے اعداد و شمار'}
              </button>
              <button
                id="tab-ml-playground"
                onClick={() => setActiveTab('ml-playground')}
                className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'ml-playground' 
                    ? 'bg-white text-rose-650 shadow-sm border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang === 'en' ? '🧠 AI Triage Lab' : '🧠 ایم ایل لیب'}
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-5 min-h-[300px]">
              
              {activeTab === 'hospitals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase font-mono tracking-wider">
                      {lang === 'en' ? 'Active dynamic blood stocks:' : 'فعال بلڈ سٹاک کی فہرست:'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map(h => (
                      <div 
                        key={h.id}
                        onClick={() => setSelectedItem(h)}
                        className={`p-4 rounded-xl border transition-all duration-300 text-xs text-left cursor-pointer ${
                          selectedItem?.id === h.id 
                            ? 'bg-rose-50/50 border-rose-400 shadow shadow-rose-100 ring-1 ring-rose-450' 
                            : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-slate-900 text-sm tracking-wide font-sans">{h.name}</h4>
                          <span className="text-[9px] font-mono shrink-0 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                            {h.city}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{h.address}</p>
                        
                        <div className="my-2.5 flex items-center justify-between border-t border-b border-slate-100 py-1.5 text-[10px] text-slate-500">
                          <span>📞 {h.phone}</span>
                          <span className="text-emerald-600 font-semibold font-sans">🟢 {h.emergencyHours}</span>
                        </div>

                        {/* Availability indicators grid */}
                        <div>
                          <span className="block text-[9px] uppercase font-mono text-slate-500 font-bold mb-1 tracking-wider">
                            {lang === 'en' ? 'In-Stock Groups:' : 'دستیابی لسٹ:'}
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {Object.entries(h.bloodAvailability).slice(0, 4).map(([group, stock]) => (
                              <div key={group} className="py-1 rounded text-center font-mono text-[9px] font-bold bg-slate-50 border border-slate-150">
                                <span className="block text-slate-600">{group}</span>
                                <span className={`text-[8px] mt-0.5 block truncate ${
                                  stock === 'In Stock' ? 'text-emerald-605' :
                                  stock === 'Low' ? 'text-amber-600 animate-pulse' :
                                  'text-red-605 font-bold'
                                }`}>
                                  {stock === 'In Stock' ? 'OK' : stock === 'Low' ? 'Low' : 'EMPTY'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons list */}
                        <div className="mt-3 flex gap-2">
                          <button 
                            id={`btn-locate-hospital-${h.id}`}
                            onClick={(e) => { e.stopPropagation(); handleSelectItem(h); }}
                            className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wide transition uppercase text-[10px] text-center shrink-0"
                          >
                            {lang === 'en' ? 'Get Directions on Map' : 'نقشے پر لوکیشن'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'camps' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {camps.map(c => (
                      <div 
                        key={c.id}
                        className="p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 flex flex-col justify-between text-xs text-left shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wide bg-amber-50 border border-amber-200/80 text-amber-700 uppercase font-semibold">
                              Drive / Camp
                            </span>
                            <span className="text-slate-500 text-[10px] font-mono">{c.city}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-2 font-sans">{c.title}</h4>
                          <p className="text-slate-600 text-[11px] mt-1">📍 {c.location}</p>
                          <p className="text-slate-500 text-[11px] mt-2 italic leading-relaxed">{c.description}</p>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                          <div className="text-[10px] text-slate-500">
                            <div className="font-sans font-semibold">📅 {c.date}</div>
                            <div className="mt-0.5 text-slate-400 font-mono">{c.time}</div>
                          </div>
                          
                          <button
                            id={`btn-register-camp-${c.id}`}
                            onClick={() => handleCampRegistration(c.id)}
                            className="px-3 py-2 rounded-lg bg-amber-650 hover:bg-amber-700 text-white font-bold font-sans tracking-wide transition duration-300 cursor-pointer text-[11px] shadow-sm"
                          >
                            {lang === 'en' ? `Register (${c.registeredCount})` : `اندراج کریں۔ (${c.registeredCount})`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <StatsDashboard lang={lang} />
              )}

              {activeTab === 'ml-playground' && (
                <MLPlayground lang={lang} />
              )}

            </div>
          </div>

          {/* EMERGENCY ACTIVE CRAWL BOARD */}
          <div id="active-emergencies-board" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base md:text-lg font-sans font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
              {lang === 'en' ? 'Active Emergency SOS Requests' : 'جاری ہنگامی بلڈ کی فیڈ'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencies.map(sos => (
                <div 
                  key={sos.id}
                  className={`p-4 rounded-xl border text-xs text-left transition ${
                    sos.status === 'Fulfilled' 
                      ? 'bg-slate-150/40 border-slate-200 text-slate-500 opacity-60' 
                      : 'bg-red-50/20 border-red-200/80 hover:border-red-300 shadow shadow-red-100/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase mb-1.5 ${
                        sos.urgency === 'Immediate (SOS)' 
                          ? 'bg-red-650 text-white animate-pulse' 
                          : 'bg-amber-100 text-amber-805 font-semibold'
                      }`}>
                        {sos.urgency}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide font-sans">{sos.patientName}</h4>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center font-sans text-base shadow shadow-red-200">
                      {sos.bloodGroup}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-650 mt-2 leading-relaxed">{sos.reason}</p>

                  <div className="my-3 border-t border-slate-100 pt-2.5 text-[10px] text-slate-500 space-y-1">
                    <div>📍 {sos.hospitalName} ({sos.city})</div>
                    <div>📞 Required By: <span className="text-red-600 font-bold">{sos.requiredBy}</span></div>
                    <div>🎯 Matching Donors Count in Area: <span className="text-emerald-700 font-bold">{sos.matchingDonorsCount} available</span></div>
                  </div>

                  {sos.status === 'Pending' ? (
                    <div className="mt-4 flex gap-2">
                      <a 
                        id={`btn-call-emergency-contact-${sos.id}`}
                        href={`tel:${sos.contactPhone}`}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-center text-slate-700 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call {sos.contactPhone}</span>
                      </a>
                      <button
                        id={`btn-fulfill-emergency-${sos.id}`}
                        onClick={() => handleFulfillSOS(sos.id)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                        title="Mark emergency as resolved and donor found"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Fulfill</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 justify-center">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{lang === 'en' ? 'FULFILLED (LIVES SAVED)' : 'رابطہ مکمل / حل شدہ'}</span>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Crisis Forms & Registries (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Launch SOS request form - highlights beautifully from AI triage commands */}
          <div className={flashSOS ? "ring-2 ring-red-500 rounded-2xl animate-pulse transition-all duration-500" : ""}>
            <SOSRequestForm 
              hospitals={hospitals} 
              onSuccess={handleSOSSuccess}
              lang={lang}
            />
          </div>

          {/* Search donor component */}
          <div id="volunteer-registries-board">
            <DonorSearch 
              donors={donors} 
              lang={lang} 
              onReviewSubmitted={loadData}
              activeTab={activeDonorTab}
              setActiveTab={setActiveDonorTab}
            />
          </div>

          {/* Hospital emergency phone directory helper list */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
            <h4 className="font-bold text-slate-900 font-sans mb-3 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600 animate-pulse" />
              {lang === 'en' ? 'Twin Cities Hotlines (24/7)' : 'ہنگامی رابطہ نمبرز'}
            </h4>
            <div className="space-y-2 text-slate-650">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span>PIMS Trauma Division</span>
                <span className="text-rose-600 font-bold font-sans">+92 51 9261170</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span>Holy Family Hospital Emergency</span>
                <span className="text-rose-600 font-bold font-sans">+92 51 9290321</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span>Shifa Emergency Ambulance</span>
                <span className="text-rose-600 font-bold font-sans">+92 51 8463000</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Rescue 1122 Helplines</span>
                <span className="text-emerald-600 font-bold font-sans">1122</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-200 text-center text-xs text-slate-500 font-sans mt-auto bg-white">
        <p>© 2026 BloodLink AI Hub Pakistan • Developed for Islamabad & Rawalpindi Crises Relief Services</p>
        <p className="mt-1 text-slate-400">Secure full-stack node services running beautifully in sandboxed architecture.</p>
      </footer>

      {/* Floating conversational companion assistant */}
      <AIChatbot 
        lang={lang} 
        onEmergencyTriggered={handleAIEmergencyTrigger}
      />

    </div>
  );
}
