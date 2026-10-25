import React, { useEffect, useRef } from 'react';
import { RickshawArt, SKINS } from '../game/RickshawArt';
import { PlayerUpgrades, RickshawSkin } from '../types/game';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  upgrades: PlayerUpgrades;
  onUpgrade: (type: keyof PlayerUpgrades, cost: number) => void;
  selectedSkin: RickshawSkin;
  onSelectSkin: (skin: RickshawSkin) => void;
  lang: 'en' | 'bn';
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  coins,
  upgrades,
  onUpgrade,
  selectedSkin,
  onSelectSkin,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render live preview of selected skin in canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderPreview = () => {
      angle += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor grid / neon pad
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.65;

      ctx.save();
      const padGrad = ctx.createRadialGradient(cx, cy + 10, 10, cx, cy + 10, 120);
      padGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
      padGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 130, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Rickshaw centered
      RickshawArt.drawRickshaw(
        ctx,
        cx - 10,
        cy,
        selectedSkin,
        35,
        angle,
        Math.sin(angle * 2) * 2,
        0,
        false,
        false,
        false
      );

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, selectedSkin]);

  if (!isOpen) return null;

  const upgradeCosts = {
    motorLevel: (upgrades.motorLevel + 1) * 300,
    batteryLevel: (upgrades.batteryLevel + 1) * 250,
    regenLevel: (upgrades.regenLevel + 1) * 280,
    bellLevel: (upgrades.bellLevel + 1) * 200,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-['Hind_Siliguri']">
      <div className="relative w-full max-w-4xl bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d1b54] mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛠️</span>
            <div>
              <h2 className="text-2xl font-black text-[#ffd23f]">
                {lang === 'bn' ? 'বাংলা টেসলা গ্যারেজ' : 'Bangla Tesla EV Garage'}
              </h2>
              <p className="text-xs text-[#a29bfe]">
                {lang === 'bn'
                  ? 'আপনার রিকশার ব্যাটারি, মোটর ও স্কিন আপগ্রেড করুন'
                  : 'Upgrade electric powertrain, regenerative KERS, and custom skins'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1f143d] border border-[#44287e] px-4 py-1.5 rounded-full">
              <span className="text-[#ffd23f] text-lg font-bold">৳</span>
              <span className="text-lg font-extrabold text-white font-mono">
                {coins}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#241747] hover:bg-[#342266] text-[#cbbbe8] hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Columns: Vehicle Preview & Skins | Powertrain Upgrades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Live Vehicle Preview & Skin Palette */}
          <div className="flex flex-col items-center bg-[#1b1033] border border-[#301c59] rounded-2xl p-4">
            <h3 className="text-sm font-bold text-[#cbbbe8] mb-2 self-start">
              {lang === 'bn' ? 'রিকশার রূপ ও ডিজাইন' : 'RICKSHAW CUSTOM SKINS'}
            </h3>

            {/* Canvas Preview */}
            <canvas
              ref={canvasRef}
              width={340}
              height={190}
              className="w-full max-w-[340px] h-[190px] rounded-xl bg-[#0e071e]"
            />

            <div className="text-center my-3">
              <span className="text-base font-black text-white">
                {lang === 'bn' ? selectedSkin.nameBn : selectedSkin.name}
              </span>
              <div className="text-xs text-[#00e5ff] font-mono mt-0.5">
                {selectedSkin.hoodArtText}
              </div>
            </div>

            {/* Skins Selector List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-2">
              {Object.values(SKINS).map((skin) => {
                const isSelected = selectedSkin.id === skin.id;
                return (
                  <button
                    key={skin.id}
                    onClick={() => onSelectSkin(skin)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e1c59] border-[#00e5ff] text-white shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-[#140c28] border-[#29174f] text-[#a29bfe] hover:bg-[#201340]'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                      style={{ backgroundColor: skin.bodyColor }}
                    />
                    <span className="truncate">{lang === 'bn' ? skin.nameBn : skin.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: EV Powertrain Upgrades */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#cbbbe8]">
              {lang === 'bn' ? 'পাওয়ারট্রেন ও ফিজিক্স আপগ্রেড' : 'POWERTRAIN & PHYSICS TUNING'}
            </h3>

            {/* 1. EV Motor Torque */}
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-extrabold text-white text-sm">
                    {lang === 'bn' ? 'হাই-টর্ক ইভি মোটর' : 'High-Torque EV Motor'}
                  </span>
                  <span className="text-xs text-[#ffd23f] font-bold font-mono">
                    Lv. {upgrades.motorLevel}/5
                  </span>
                </div>
                <p className="text-xs text-[#a29bfe] mt-1">
                  {lang === 'bn'
                    ? 'দ্রুত ত্বরণ ও সর্বোচ্চ গতি বৃদ্ধি (+12% per level)'
                    : 'Increases top speed and immediate acceleration torque'}
                </p>
              </div>

              <button
                disabled={upgrades.motorLevel >= 5 || coins < upgradeCosts.motorLevel}
                onClick={() => onUpgrade('motorLevel', upgradeCosts.motorLevel)}
                className="px-4 py-2 rounded-xl bg-[#ffd23f] disabled:bg-[#3d3255] text-[#120a26] disabled:text-[#7f749e] font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow transition-all shrink-0 ml-3"
              >
                {upgrades.motorLevel >= 5
                  ? 'MAX'
                  : `৳ ${upgradeCosts.motorLevel}`}
              </button>
            </div>

            {/* 2. LFP Battery Capacity */}
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔋</span>
                  <span className="font-extrabold text-white text-sm">
                    {lang === 'bn' ? 'এলএফপি ব্যাটারি প্যাক' : 'LFP High-Density Battery'}
                  </span>
                  <span className="text-xs text-[#ffd23f] font-bold font-mono">
                    Lv. {upgrades.batteryLevel}/5
                  </span>
                </div>
                <p className="text-xs text-[#a29bfe] mt-1">
                  {lang === 'bn'
                    ? 'ধীর ব্যাটারি ক্ষয় ও দীর্ঘ পথ চলার ক্ষমতা'
                    : 'Lowers energy drain rate during sustained cruise'}
                </p>
              </div>

              <button
                disabled={upgrades.batteryLevel >= 5 || coins < upgradeCosts.batteryLevel}
                onClick={() => onUpgrade('batteryLevel', upgradeCosts.batteryLevel)}
                className="px-4 py-2 rounded-xl bg-[#ffd23f] disabled:bg-[#3d3255] text-[#120a26] disabled:text-[#7f749e] font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow transition-all shrink-0 ml-3"
              >
                {upgrades.batteryLevel >= 5
                  ? 'MAX'
                  : `৳ ${upgradeCosts.batteryLevel}`}
              </button>
            </div>

            {/* 3. Regenerative Braking KERS */}
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">♻️</span>
                  <span className="font-extrabold text-white text-sm">
                    {lang === 'bn' ? 'রিজেনারেটিভ ব্রেকিং (KERS)' : 'Regen Braking KERS'}
                  </span>
                  <span className="text-xs text-[#ffd23f] font-bold font-mono">
                    Lv. {upgrades.regenLevel}/5
                  </span>
                </div>
                <p className="text-xs text-[#a29bfe] mt-1">
                  {lang === 'bn'
                    ? 'ব্রেক করলে ব্যাটারিতে চার্জ ফেরত আসার পরিমাণ বৃদ্ধি'
                    : 'Reclaims kinetic braking energy directly back to battery'}
                </p>
              </div>

              <button
                disabled={upgrades.regenLevel >= 5 || coins < upgradeCosts.regenLevel}
                onClick={() => onUpgrade('regenLevel', upgradeCosts.regenLevel)}
                className="px-4 py-2 rounded-xl bg-[#ffd23f] disabled:bg-[#3d3255] text-[#120a26] disabled:text-[#7f749e] font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow transition-all shrink-0 ml-3"
              >
                {upgrades.regenLevel >= 5
                  ? 'MAX'
                  : `৳ ${upgradeCosts.regenLevel}`}
              </button>
            </div>

            {/* 4. Sonic Brass Bell */}
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔔</span>
                  <span className="font-extrabold text-white text-sm">
                    {lang === 'bn' ? 'সনিক ব্রাস ঘণ্টি' : 'Sonic Bell Resonance'}
                  </span>
                  <span className="text-xs text-[#ffd23f] font-bold font-mono">
                    Lv. {upgrades.bellLevel}/5
                  </span>
                </div>
                <p className="text-xs text-[#a29bfe] mt-1">
                  {lang === 'bn'
                    ? 'ব্যাপক ব্যাসার্ধে পথচারী সরানো ও সিএনজি সাইড দেওয়ার ক্ষমতা'
                    : 'Increases alert radius to clear pedestrians and CNGs faster'}
                </p>
              </div>

              <button
                disabled={upgrades.bellLevel >= 5 || coins < upgradeCosts.bellLevel}
                onClick={() => onUpgrade('bellLevel', upgradeCosts.bellLevel)}
                className="px-4 py-2 rounded-xl bg-[#ffd23f] disabled:bg-[#3d3255] text-[#120a26] disabled:text-[#7f749e] font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow transition-all shrink-0 ml-3"
              >
                {upgrades.bellLevel >= 5
                  ? 'MAX'
                  : `৳ ${upgradeCosts.bellLevel}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
