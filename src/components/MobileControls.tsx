import React from 'react';

interface MobileControlsProps {
  onThrottleChange: (active: boolean) => void;
  onBrakeChange: (active: boolean) => void;
  onLaneChange: (direction: 'up' | 'down') => void;
  onBell: () => void;
  onBoost: () => void;
  lang: 'en' | 'bn';
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onThrottleChange,
  onBrakeChange,
  onLaneChange,
  onBell,
  onBoost,
  lang,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none select-none z-30 flex justify-between px-4 sm:px-8 font-['Hind_Siliguri']">
      {/* Left Hand: Lane Steering */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onLaneChange('up');
          }}
          onMouseDown={() => onLaneChange('up')}
          className="w-14 h-14 bg-[#231545]/90 border-2 border-[#573b94] active:bg-[#ffd23f] active:text-[#1d1428] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-xl cursor-pointer select-none touch-none"
          aria-label="Lane Up"
        >
          ▲
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onLaneChange('down');
          }}
          onMouseDown={() => onLaneChange('down')}
          className="w-14 h-14 bg-[#231545]/90 border-2 border-[#573b94] active:bg-[#ffd23f] active:text-[#1d1428] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-xl cursor-pointer select-none touch-none"
          aria-label="Lane Down"
        >
          ▼
        </button>
      </div>

      {/* Right Hand: Throttle, Brake/Regen, Boost, Bell */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Brake & Regen */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBrakeChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onBrakeChange(false);
          }}
          onMouseDown={() => onBrakeChange(true)}
          onMouseUp={() => onBrakeChange(false)}
          className="w-13 h-13 bg-[#d63031]/80 border-2 border-[#ff7675] active:bg-[#ff7675] text-white rounded-2xl flex flex-col items-center justify-center text-xs font-bold shadow-xl cursor-pointer select-none touch-none"
        >
          <span className="text-sm">🛑</span>
          <span>{lang === 'bn' ? 'রিজেন' : 'REGEN'}</span>
        </button>

        {/* Bell Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBell();
          }}
          onMouseDown={onBell}
          className="w-13 h-13 bg-[#ffd23f]/90 border-2 border-[#ffeaa7] text-[#1d1428] active:scale-95 rounded-2xl flex flex-col items-center justify-center text-xs font-black shadow-xl cursor-pointer select-none touch-none"
        >
          <span className="text-base">🔔</span>
          <span>{lang === 'bn' ? 'ঘণ্টি' : 'BELL'}</span>
        </button>

        {/* Boost Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBoost();
          }}
          onMouseDown={onBoost}
          className="w-13 h-13 bg-[#ff4fa3]/90 border-2 border-[#ff7979] text-white active:scale-95 rounded-2xl flex flex-col items-center justify-center text-xs font-black shadow-xl cursor-pointer select-none touch-none shadow-[0_0_10px_#ff4fa3]"
        >
          <span className="text-base">⚡</span>
          <span>{lang === 'bn' ? 'টার্বো' : 'BOOST'}</span>
        </button>

        {/* Throttle (Gas Pedal) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onThrottleChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onThrottleChange(false);
          }}
          onMouseDown={() => onThrottleChange(true)}
          onMouseUp={() => onThrottleChange(false)}
          className="w-16 h-18 bg-[#00b894] border-2 border-[#55efc4] active:bg-[#55efc4] text-[#120a26] rounded-2xl flex flex-col items-center justify-center text-sm font-extrabold shadow-xl cursor-pointer select-none touch-none ml-1"
        >
          <span className="text-lg">⚡</span>
          <span>{lang === 'bn' ? 'ড্রাইভ' : 'DRIVE'}</span>
        </button>
      </div>
    </div>
  );
};
