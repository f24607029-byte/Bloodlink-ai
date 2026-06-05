import { useState } from "react";
import { Donor } from "../types";
import { API_BASE } from "../lib/api";
import { Award, Zap, Calendar, Heart, Shield, RefreshCw } from "lucide-react";

interface DonorStreakBadgeProps {
  donor: Donor;
  onToggleAvailability: (available: boolean) => void;
  lang: 'en' | 'ur';
}

export default function DonorStreakBadge({ donor, onToggleAvailability, lang }: DonorStreakBadgeProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/donors/toggle-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !donor.isAvailable })
      });
      if (response.ok) {
        const data = await response.json();
        onToggleAvailability(data.donor.isAvailable);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="donor-streak-gamification-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
      {/* Absolute glow decorative elements */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-rose-500/5 blur-xl"></div>

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-rose-50 border border-rose-100 text-rose-700 font-bold uppercase">
            {lang === 'en' ? 'SAVIOR ACCOUNT PROFILE' : 'رضاکار پروفائل'}
          </span>
          <h4 className="text-sm font-bold text-slate-900 font-sans tracking-wide mt-1.5 flex items-center gap-1.5">
            {donor.name}
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lang === 'en' ? 'Registered O+ Emergency Hero' : 'راولپنڈی و اسلام آباد مستقل ہیرو'}
          </p>
        </div>

        {/* Big Blood Badge */}
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm select-none">
          {donor.bloodGroup}
        </div>
      </div>

      {/* Gamified Stat counters */}
      <div className="grid grid-cols-3 gap-3.5 mt-5 border-t border-b border-slate-100 py-3.5 relative z-10 text-center font-sans text-xs">
        {/* Streak counter */}
        <div>
          <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{donor.stats.streakCount}</span>
          </div>
          <span className="block text-[10px] text-slate-400 mt-1 uppercase font-mono">
            {lang === 'en' ? 'Streak Days' : 'تسلسل دن'}
          </span>
        </div>

        {/* Total bags donated */}
        <div>
          <div className="font-bold text-rose-600 flex items-center justify-center gap-1">
            <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
            <span>{donor.stats.donationsCount}</span>
          </div>
          <span className="block text-[10px] text-slate-400 mt-1 uppercase font-mono">
            {lang === 'en' ? 'Bags Donated' : 'عطیات بیگز'}
          </span>
        </div>

        {/* Lives saved */}
        <div>
          <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>{donor.stats.livesSaved}</span>
          </div>
          <span className="block text-[10px] text-slate-400 mt-1 uppercase font-mono">
            {lang === 'en' ? 'Lives Saved' : 'بچائی گئی جانیں'}
          </span>
        </div>
      </div>

      {/* Badges section */}
      <div className="mt-4 relative z-10">
        <span className="block text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider mb-2">
          {lang === 'en' ? 'Unlocked Savior Medals:' : 'حاصل کردہ اعزازات:'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {donor.badges.map((badge, idx) => (
            <span 
              key={idx}
              className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-sans tracking-wide flex items-center gap-1"
            >
              <Award className="w-3 h-3 text-amber-500" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Toggling Availability bar */}
      <div className="mt-4.5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10 font-sans">
        <span className="text-slate-500">
          {lang === 'en' ? 'Emergency Active Status' : 'ہنگامی دستیابی کا سٹیٹس'}
        </span>
        <button
          id="btn-toggle-availability-streak"
          onClick={handleToggle}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wide transition-all duration-300 ${
            donor.isAvailable 
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800' 
              : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
          ) : donor.isAvailable ? (
            lang === 'en' ? '● AVAILABLE' : '● دستیاب'
          ) : (
            lang === 'en' ? '○ OFFLINE' : '○ غیر دستیاب'
          )}
        </button>
      </div>
    </div>
  );
}
