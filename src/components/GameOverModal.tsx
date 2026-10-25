import confetti from 'canvas-confetti';
import React, { useEffect, useState } from 'react';
import { RouteConfig } from '../types/game';

interface GameOverModalProps {
  isOpen: boolean;
  result: {
    win: boolean;
    timeSec: number;
    distanceKm: number;
    coins: number;
    score: number;
    isNewRecord?: boolean;
    timeSavedSec?: number;
    previousBestTime?: number;
  } | null;
  route: RouteConfig;
  onRetry: () => void;
  onExit: () => void;
  lang: 'en' | 'bn';
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  result,
  route,
  onRetry,
  onExit,
  lang,
}) => {
  const [playerName, setPlayerName] = useState<string>('DhakaRacer');
  const [city, setCity] = useState<string>('Dhaka');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && result?.win) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    }
    setSubmitted(false);
    setSubmittedRank(null);
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const handleSubmitScore = () => {
    if (submitted) return;
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: playerName.trim() || 'DhakaRacer',
        score: result.score,
        distanceKm: result.distanceKm,
        timeSec: result.timeSec,
        routeId: route.id,
        skinId: 'tesla',
        city,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubmitted(true);
          setSubmittedRank(data.rank);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 font-['Hind_Siliguri']">
      <div className="w-full max-w-md bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center">
        {/* Victory / Finish Banner */}
        <span className="text-5xl mb-2">{result.win ? '🏁' : '🚦'}</span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#ffd23f] mb-1">
          {result.win
            ? lang === 'bn' ? 'গন্তব্যে পৌঁছেছেন!' : 'RACE FINISHED!'
            : lang === 'bn' ? 'রান শেষ হয়েছে!' : 'RUN COMPLETED!'}
        </h2>
        <p className="text-xs text-[#a29bfe] mb-5">
          {lang === 'bn' ? route.nameBn : route.name}
        </p>

        {/* Personal Best Record Achievement Banner */}
        {result.isNewRecord && (
          <div className="w-full bg-gradient-to-r from-[#00f2fe]/20 via-[#4facfe]/25 to-[#00f2fe]/20 border border-[#00f2fe] rounded-2xl p-3 mb-5 shadow-[0_0_20px_rgba(0,242,254,0.35)] animate-pulse">
            <div className="flex items-center justify-center gap-2 text-[#00f2fe] font-black text-sm sm:text-base">
              <span>⚡</span>
              <span>
                {lang === 'bn' ? '🎉 নতুন ব্যক্তিগত রেকর্ড (PERSONAL BEST)!' : '🎉 NEW PERSONAL RECORD!'}
              </span>
            </div>
            {result.timeSavedSec !== undefined && result.timeSavedSec > 0 && (
              <div className="text-xs text-white/95 font-mono mt-1 font-semibold">
                {lang === 'bn'
                  ? `পূর্বের সেরা থেকে ${result.timeSavedSec} সেকেন্ড দ্রুত! (নতুন শ্যাডো সংরক্ষিত)`
                  : `Faster by -${result.timeSavedSec}s than previous ghost! (Ghost shadow saved)`}
              </div>
            )}
            {result.previousBestTime !== undefined && (
              <div className="text-[11px] text-[#a29bfe] font-mono mt-0.5">
                {lang === 'bn' ? 'আগের রেকর্ড:' : 'Previous Best:'} {result.previousBestTime}s ➔ {result.timeSec}s
              </div>
            )}
          </div>
        )}

        {/* Score & Metric Clusters */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          <div className="bg-[#1b1033] border border-[#301c59] p-3 rounded-2xl">
            <span className="text-[11px] text-[#a29bfe] font-semibold block">
              {lang === 'bn' ? 'মোট দূরত্ব' : 'DISTANCE'}
            </span>
            <span className="text-xl font-black text-white tabular-nums font-mono">
              {result.distanceKm} km
            </span>
          </div>

          <div className="bg-[#1b1033] border border-[#301c59] p-3 rounded-2xl">
            <span className="text-[11px] text-[#a29bfe] font-semibold block">
              {lang === 'bn' ? 'সময়' : 'TIME'}
            </span>
            <span className="text-xl font-black text-white tabular-nums font-mono">
              {result.timeSec}s
            </span>
          </div>

          <div className="bg-[#1b1033] border border-[#301c59] p-3 rounded-2xl">
            <span className="text-[11px] text-[#a29bfe] font-semibold block">
              {lang === 'bn' ? 'সংগৃহীত টাকা' : 'EARNED TAKA'}
            </span>
            <span className="text-xl font-black text-[#ffd23f] tabular-nums font-mono">
              ৳ {result.coins}
            </span>
          </div>

          <div className="bg-[#1b1033] border border-[#301c59] p-3 rounded-2xl">
            <span className="text-[11px] text-[#a29bfe] font-semibold block">
              {lang === 'bn' ? 'মোট স্কোর' : 'TOTAL SCORE'}
            </span>
            <span className="text-xl font-black text-[#00e5ff] tabular-nums font-mono">
              {result.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Submit to Global Leaderboard Form */}
        <div className="w-full bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 mb-5 text-left">
          <div className="text-xs text-[#a29bfe] font-bold mb-2 flex items-center justify-between">
            <span>{lang === 'bn' ? 'লিডারবোর্ডে স্কোর যোগ করুন:' : 'POST TO GLOBAL LEADERBOARD:'}</span>
            {submittedRank && (
              <span className="text-[#ffd23f] font-black">Rank #{submittedRank}!</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={submitted}
              placeholder="Your name"
              maxLength={16}
              className="flex-1 bg-[#110724] border border-[#3b1c6c] rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#ffd23f]"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={submitted}
              className="bg-[#110724] border border-[#3b1c6c] rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
            >
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Rajshahi">Rajshahi</option>
              <option value="Khulna">Khulna</option>
              <option value="Barisal">Barisal</option>
            </select>
            <button
              onClick={handleSubmitScore}
              disabled={submitted}
              className="px-3 py-1.5 rounded-xl bg-[#ffd23f] disabled:bg-[#352554] text-[#120a26] disabled:text-[#7f749e] font-black text-xs cursor-pointer shadow transition-all"
            >
              {submitted ? (lang === 'bn' ? 'দাখিলকৃত ✓' : 'Posted ✓') : (lang === 'bn' ? 'জমা দিন' : 'Submit')}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl bg-[#ffd23f] hover:bg-[#ffe27a] text-[#120a26] font-black text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            {lang === 'bn' ? 'আবার খেলুন' : 'RETRY RACE'}
          </button>

          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl bg-[#231545] hover:bg-[#332063] border border-[#44287e] text-white font-bold text-sm cursor-pointer active:scale-95 transition-all"
          >
            {lang === 'bn' ? 'প্রধান মেন্যু' : 'MAIN MENU'}
          </button>
        </div>
      </div>
    </div>
  );
};
