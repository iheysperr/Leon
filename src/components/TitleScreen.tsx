import React from 'react';
import { RouteConfig } from '../types/game';

interface TitleScreenProps {
  onStartStory: (route: RouteConfig) => void;
  onStartEndless: () => void;
  onOpenMultiplayer: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  onOpenDailyRewards: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  lang: 'en' | 'bn';
  onToggleLang: () => void;
  routes: RouteConfig[];
  selectedRoute: RouteConfig;
  onSelectRoute: (r: RouteConfig) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartStory,
  onStartEndless,
  onOpenMultiplayer,
  onOpenGarage,
  onOpenLeaderboard,
  onOpenDailyRewards,
  onToggleSound,
  isMuted,
  lang,
  onToggleLang,
  routes,
  selectedRoute,
  onSelectRoute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 sm:p-10 select-none bg-gradient-to-b from-[#0b0618]/90 via-[#1b1033]/60 to-[#0b0618]/95 overflow-y-auto font-['Hind_Siliguri']">
      {/* Top Header Bar: Language, Audio, Daily Rewards, Garage */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Daily Streak Indicator Badge */}
          <button
            onClick={onOpenDailyRewards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd23f]/10 border border-[#ffd23f]/40 hover:bg-[#ffd23f]/25 text-[#ffd23f] text-xs font-bold transition-all cursor-pointer"
          >
            <span>🎁</span>
            <span>{lang === 'bn' ? 'দৈনিক পুরস্কার ও সিজন' : 'Daily Rewards & Season'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-9 h-9 rounded-lg bg-[#1e1338] border border-[#3e276e] hover:bg-[#2d1c54] text-[#cbbbe8] flex items-center justify-center text-sm cursor-pointer transition-all"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-lg bg-[#1e1338] border border-[#3e276e] hover:bg-[#2d1c54] text-xs font-bold text-[#ffd23f] cursor-pointer transition-all"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </div>

      {/* Atmospheric Centerpiece & Bespoke Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto max-w-3xl">
        {/* Inline Bespoke SVG Title Lockup */}
        <div className="relative mb-2">
          <svg
            viewBox="0 0 680 140"
            className="w-full max-w-[580px] h-auto drop-shadow-[0_0_24px_rgba(255,210,63,0.35)]"
          >
            <defs>
              <linearGradient id="cyberGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff275" />
                <stop offset="50%" stopColor="#ffd23f" />
                <stop offset="100%" stopColor="#ff9f1a" />
              </linearGradient>
              <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>

            {/* Glowing Bangla Typography "বাংলা টেসলা" */}
            <text
              x="50%"
              y="75"
              textAnchor="middle"
              className="font-['Galada','Hind_Siliguri',sans-serif] text-[74px] font-black"
              fill="url(#cyberGold)"
              stroke="#0f0722"
              strokeWidth="5"
              paintOrder="stroke fill"
              style={{
                textShadow: '0 4px 0 #ff4fa3, 0 8px 0 #35d07f, 0 12px 16px rgba(0,0,0,0.8)',
              }}
            >
              বাংলা টেসলা
            </text>

            {/* Subtitle Latin Kicker "DHAKA RICKSHAW RACE 2077" */}
            <text
              x="50%"
              y="118"
              textAnchor="middle"
              className="font-['JetBrains_Mono',sans-serif] text-[18px] font-extrabold tracking-[0.28em]"
              fill="url(#neonCyan)"
              stroke="#0f0722"
              strokeWidth="2"
            >
              DHAKA RICKSHAW RACE · NEXT-GEN EV
            </text>
          </svg>
        </div>

        {/* Tagline / Subtitle */}
        <p className="text-sm sm:text-base text-[#cbbbe8] max-w-xl mx-auto mb-6 font-medium leading-relaxed">
          {lang === 'bn'
            ? 'উন্নত ফিজিক্স, রিজেনারেটিভ ব্রেকিং, বাসের ড্রাফটিং ও লাইভ মাল্টিপ্লেয়ার রেসে অংশ নিন!'
            : 'Next-gen electric rickshaw racing through Dhaka with advanced EV torque, regenerative braking, slipstream drafting, and real-time multiplayer!'}
        </p>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-6">
          <button
            onClick={() => onStartStory(selectedRoute)}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#ffd23f] to-[#ffaa00] text-[#120a26] font-black text-lg tracking-wide shadow-[0_0_25px_rgba(255,210,63,0.45)] hover:shadow-[0_0_35px_rgba(255,210,63,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-[#120a26]"
          >
            {lang === 'bn' ? 'রেস শুরু করুন (Enter)' : 'START RACE (Enter)'}
          </button>

          <button
            onClick={onStartEndless}
            className="px-6 py-3.5 rounded-full bg-[#ff4fa3] hover:bg-[#ff308f] text-white font-extrabold text-base tracking-wide shadow-[0_0_20px_rgba(255,79,163,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-[#120a26]"
          >
            {lang === 'bn' ? '🚦 জ্যাম মোড (Endless)' : '🚦 Endless Jam Mode'}
          </button>

          <button
            onClick={onOpenMultiplayer}
            className="px-6 py-3.5 rounded-full bg-[#00e5ff] hover:bg-[#00c9e0] text-[#0b0817] font-extrabold text-base tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-[#120a26] flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>{lang === 'bn' ? 'অনলাইন মাল্টিপ্লেয়ার' : 'Live Multiplayer'}</span>
          </button>
        </div>

        {/* Story Route Picker Segmented Selector */}
        <div className="w-full max-w-2xl bg-[#140c2a]/90 border border-[#3b236e] rounded-2xl p-3 shadow-xl mb-4">
          <div className="text-xs text-[#a29bfe] font-bold mb-2 flex items-center justify-between">
            <span>{lang === 'bn' ? 'রুট নির্বাচন করুন:' : 'SELECT STORY ROUTE:'}</span>
            <span className="text-[#ffd23f] font-mono">
              {selectedRoute.km} KM · {selectedRoute.weather.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {routes.filter((r) => r.id !== 'endless').map((r) => {
              const isSelected = selectedRoute.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectRoute(r)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffd23f] text-[#120a26] shadow-md scale-102'
                      : 'bg-[#1e1338] hover:bg-[#2c1b52] text-[#cbbbe8]'
                  }`}
                >
                  <div className="truncate">{lang === 'bn' ? r.from : r.from}</div>
                  <div className="text-[10px] opacity-75">{r.km} km</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hub Action Buttons: Garage, Leaderboard, Quests */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b1033] hover:bg-[#2d1b54] border border-[#44287e] text-xs font-bold text-[#cbbbe8] hover:text-white transition-all cursor-pointer"
          >
            <span>🛠️</span>
            <span>{lang === 'bn' ? 'গ্যারেজ ও আপগ্রেড' : 'Garage & Tuning'}</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b1033] hover:bg-[#2d1b54] border border-[#44287e] text-xs font-bold text-[#cbbbe8] hover:text-white transition-all cursor-pointer"
          >
            <span>🏆</span>
            <span>{lang === 'bn' ? 'গ্লোবাল লিডারবোর্ড' : 'Global Leaderboard'}</span>
          </button>

          <button
            onClick={onOpenDailyRewards}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b1033] hover:bg-[#2d1b54] border border-[#44287e] text-xs font-bold text-[#ffd23f] hover:text-white transition-all cursor-pointer"
          >
            <span>🎯</span>
            <span>{lang === 'bn' ? 'দৈনিক মিশন' : 'Daily Quests'}</span>
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line (Required by Game Craft Constitution) */}
      <div className="w-full text-center py-2 border-t border-[#29174f]/60">
        <p className="text-xs sm:text-sm text-[#8a7ba8] font-mono tracking-wide">
          {lang === 'bn'
            ? 'WASD / তীরচিহ্ন ড্রাইভ · Space বুস্ট · B ঘণ্টি · Esc পজ'
            : 'WASD / Arrows Steer & Drive · Space Turbo · B Rickshaw Bell · Esc Pause'}
        </p>
      </div>
    </div>
  );
};
