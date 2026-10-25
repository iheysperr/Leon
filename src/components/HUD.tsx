import React from 'react';
import { DynamicWeatherState, GhostComparison, RouteConfig } from '../types/game';

interface HUDProps {
  speedKmh: number;
  batteryPercent: number;
  isRegenerating: boolean;
  distanceKm: number;
  route: RouteConfig;
  coins: number;
  score: number;
  elapsedTimeSec: number;
  isDrafting: boolean;
  boostCooldown: number;
  boostTimeLeft: number;
  bellCooldown: number;
  weather?: DynamicWeatherState;
  onCycleWeather?: () => void;
  ghostComparison?: GhostComparison | null;
  isGhostEnabled?: boolean;
  onToggleGhost?: () => void;
  lang: 'en' | 'bn';
  onPause: () => void;
  onBell: () => void;
  onBoost: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmh,
  batteryPercent,
  isRegenerating,
  distanceKm,
  route,
  coins,
  elapsedTimeSec,
  isDrafting,
  boostCooldown,
  boostTimeLeft,
  bellCooldown,
  weather,
  onCycleWeather,
  ghostComparison,
  isGhostEnabled = true,
  onToggleGhost,
  lang,
  onPause,
  onBell,
  onBoost,
}) => {
  const isEndless = route.km === Infinity;
  const progressRatio = isEndless ? 0 : Math.min(1, distanceKm / route.km);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getWeatherIcon = (type?: string) => {
    switch (type) {
      case 'rain': return '🌧️';
      case 'fog': return '🌫️';
      case 'sunset': return '🌅';
      case 'night': return '🌙';
      default: return '☀️';
    }
  };

  const tractionPercent = weather ? Math.round(weather.traction * 100) : 100;
  const visibilityPercent = weather ? Math.round(weather.visibility * 100) : 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 sm:p-6 font-['Hind_Siliguri']">
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left Cluster: Battery & Speed */}
        <div className="flex items-center gap-3">
          {/* Battery Status */}
          <div className="bg-[#120a26]/90 border border-[#2d1b54] px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
            <div className="relative w-10 h-5 border-2 border-[#55efc4] rounded-sm p-0.5 flex items-center">
              <div
                className={`h-full transition-all duration-150 rounded-xs ${
                  isRegenerating
                    ? 'bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]'
                    : batteryPercent > 20
                    ? 'bg-[#00b894]'
                    : 'bg-[#ff7675] shadow-[0_0_8px_#ff7675]'
                }`}
                style={{ width: `${Math.max(4, batteryPercent)}%` }}
              />
              <div className="absolute -right-1.5 w-1 h-2 bg-[#55efc4] rounded-r-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs text-[#a29bfe] font-semibold">
                  {lang === 'bn' ? 'ব্যাটারি' : 'BATTERY'}
                </span>
                {isRegenerating && (
                  <span className="text-[10px] text-[#00e5ff] font-bold animate-pulse">
                    ⚡ {lang === 'bn' ? 'রিজেন' : 'REGEN'}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white tabular-nums leading-tight">
                {batteryPercent}%
              </div>
            </div>
          </div>

          {/* Speedometer */}
          <div className="bg-[#120a26]/90 border border-[#2d1b54] px-4 py-2 rounded-xl shadow-lg flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#ffd23f] tabular-nums font-mono">
              {speedKmh}
            </span>
            <span className="text-xs text-[#cbbbe8] font-bold">
              {lang === 'bn' ? 'কিমি/ঘণ্টা' : 'KM/H'}
            </span>
          </div>

          {/* Dynamic Weather & Handling Status Indicator */}
          {weather && (
            <button
              onClick={onCycleWeather}
              title="Click to cycle dynamic weather conditions"
              className="pointer-events-auto bg-[#120a26]/90 hover:bg-[#1f123d] border border-[#2d1b54] hover:border-[#ffd23f]/50 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="text-lg">{getWeatherIcon(weather.current)}</span>
              <div className="text-left leading-none">
                <div className="text-xs font-extrabold text-white">
                  {lang === 'bn' ? weather.nameBn : weather.name}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
                  <span className={tractionPercent < 75 ? 'text-[#ff7675] font-bold' : 'text-[#55efc4]'}>
                    {lang === 'bn' ? 'গ্রিপ' : 'GRIP'} {tractionPercent}%
                  </span>
                  {visibilityPercent < 80 && (
                    <span className="text-[#00e5ff] font-bold">
                      {lang === 'bn' ? 'দৃষ্টি' : 'VIS'} {visibilityPercent}%
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Center Cluster: Route Distance & Drafting Indicator */}
        <div className="hidden md:flex flex-col items-center gap-1.5 w-72">
          <div className="flex justify-between w-full text-xs text-[#cbbbe8] font-semibold">
            <span>{lang === 'bn' ? route.from : route.from}</span>
            <span className="text-[#ffd23f] font-bold tabular-nums">
              {distanceKm.toFixed(1)} {isEndless ? 'km' : `/ ${route.km} km`}
            </span>
            <span>{isEndless ? '∞' : route.to}</span>
          </div>

          <div className="relative w-full h-2.5 bg-[#1b1033] border border-[#3b236e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00b894] via-[#ffd23f] to-[#ff4fa3] transition-all duration-200"
              style={{ width: `${Math.min(100, isEndless ? (distanceKm % 10) * 10 : progressRatio * 100)}%` }}
            />
          </div>

          {/* Aerodynamic Drafting Badge */}
          {isDrafting && (
            <div className="bg-[#00e5ff]/20 border border-[#00e5ff] text-[#00e5ff] px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
              <span>💨</span>
              <span>{lang === 'bn' ? 'স্লিপস্ট্রিম ড্রাফটিং! +গতি' : 'SLIPSTREAM DRAFTING! +SPEED'}</span>
            </div>
          )}

          {/* Holographic Ghost Mode Live Comparison Delta */}
          {isGhostEnabled && ghostComparison && ghostComparison.hasGhost && (
            <div
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono flex items-center gap-1.5 shadow-md border ${
                ghostComparison.deltaDistanceMeters >= 0
                  ? 'bg-emerald-950/85 border-emerald-400 text-emerald-300'
                  : 'bg-rose-950/85 border-rose-400 text-rose-300'
              }`}
            >
              <span>👻</span>
              <span>
                {lang === 'bn' ? 'রেকর্ড শ্যাডো' : 'PB GHOST'}:{' '}
                {ghostComparison.deltaDistanceMeters >= 0 ? '+' : ''}
                {Math.round(ghostComparison.deltaDistanceMeters)}m (
                {ghostComparison.deltaDistanceMeters >= 0 ? '-' : '+'}
                {Math.abs(ghostComparison.deltaTimeSec).toFixed(1)}s)
              </span>
            </div>
          )}
        </div>

        {/* Right Cluster: Taka Coins, Timer, Ghost Toggle & Pause */}
        <div className="flex items-center gap-2.5">
          {/* Ghost Mode Quick Toggle */}
          {onToggleGhost && (
            <button
              onClick={onToggleGhost}
              title={isGhostEnabled ? 'Ghost Mode Active: Racing vs Personal Record' : 'Ghost Mode Inactive'}
              className={`pointer-events-auto border px-2.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isGhostEnabled
                  ? 'bg-[#00f2fe]/15 border-[#00f2fe]/60 text-[#00f2fe] hover:bg-[#00f2fe]/25'
                  : 'bg-[#120a26]/90 border-[#3d2a68] text-white/40 hover:text-white/70'
              }`}
            >
              <span className="text-sm">👻</span>
              <span className="text-[11px] font-bold font-mono tracking-wider hidden sm:inline">
                {isGhostEnabled ? 'GHOST ON' : 'GHOST OFF'}
              </span>
            </button>
          )}

          {/* Taka Coins */}
          <div className="bg-[#120a26]/90 border border-[#2d1b54] px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2">
            <span className="text-lg text-[#ffd23f]">৳</span>
            <span className="text-lg font-extrabold text-white tabular-nums font-mono">
              {coins}
            </span>
          </div>

          {/* Timer */}
          <div className="bg-[#120a26]/90 border border-[#2d1b54] px-3 py-2 rounded-xl shadow-lg text-sm font-bold text-[#cbbbe8] tabular-nums font-mono">
            {formatTime(elapsedTimeSec)}
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto bg-[#ffd23f] hover:bg-[#ffe27a] text-[#1d1428] w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md cursor-pointer transition-transform active:scale-95"
            title="Pause Game (Esc)"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* Bottom Center Quick Action Cluster (Desktop shortcuts hint) */}
      <div className="flex items-center justify-center gap-4 mb-2">
        {/* Bell Button / Indicator */}
        <button
          onClick={onBell}
          disabled={bellCooldown > 0}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-lg ${
            bellCooldown > 0
              ? 'bg-[#1b1033]/80 border-[#3d2a68] text-white/40 cursor-not-allowed'
              : 'bg-[#ffd23f] border-[#1d1428] text-[#1d1428] hover:bg-[#ffe27a] active:scale-95 cursor-pointer'
          }`}
        >
          <span className="text-base">🔔</span>
          <span>{lang === 'bn' ? 'ঘণ্টি (B)' : 'BELL (B)'}</span>
          {bellCooldown > 0 && (
            <span className="text-xs tabular-nums text-white/50">
              {bellCooldown.toFixed(1)}s
            </span>
          )}
        </button>

        {/* Turbo Boost Button / Indicator */}
        <button
          onClick={onBoost}
          disabled={boostCooldown > 0 || boostTimeLeft > 0 || batteryPercent < 10}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-lg ${
            boostTimeLeft > 0
              ? 'bg-[#00f2fe] border-white text-[#120a26] animate-pulse'
              : boostCooldown > 0 || batteryPercent < 10
              ? 'bg-[#1b1033]/80 border-[#3d2a68] text-white/40 cursor-not-allowed'
              : 'bg-[#ff4fa3] border-[#1d1428] text-white hover:bg-[#ff69b4] active:scale-95 cursor-pointer shadow-[0_0_12px_#ff4fa3]'
          }`}
        >
          <span className="text-base">⚡</span>
          <span>
            {boostTimeLeft > 0
              ? lang === 'bn' ? 'বুস্ট চালু!' : 'BOOST ACTIVE!'
              : lang === 'bn' ? 'টার্বো (Space)' : 'BOOST (Space)'}
          </span>
          {boostCooldown > 0 && boostTimeLeft <= 0 && (
            <span className="text-xs tabular-nums text-white/50">
              {boostCooldown.toFixed(1)}s
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
