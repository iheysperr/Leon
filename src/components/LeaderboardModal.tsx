import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/leaderboard?route=${selectedRoute}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setEntries(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, selectedRoute]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-['Hind_Siliguri']">
      <div className="relative w-full max-w-3xl bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d1b54] mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-black text-[#ffd23f]">
                {lang === 'bn' ? 'গ্লোবাল হাই-স্কোর লিডারবোর্ড' : 'Global High-Score Competition'}
              </h2>
              <p className="text-xs text-[#a29bfe]">
                {lang === 'bn'
                  ? 'ঢাকা শহরের সেরা ড্রাইভারদের র‍্যাংকিং ও রেকর্ড'
                  : 'Real-time global rankings across all Dhaka routes and endless mode'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#241747] hover:bg-[#342266] text-[#cbbbe8] hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Route Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: 'all', label: 'All Routes', labelBn: 'সকল রুট' },
            { id: 'endless', label: 'Endless Jam', labelBn: 'জ্যাম মোড' },
            { id: 'farmgate', label: 'Farmgate', labelBn: 'ফার্মগেট' },
            { id: 'dhanmondi', label: 'Dhanmondi', labelBn: 'ধানমন্ডি' },
            { id: 'gulshan', label: 'Gulshan', labelBn: 'গুলশান' },
            { id: 'puran', label: 'Puran Dhaka', labelBn: 'পুরান ঢাকা' },
            { id: 'motijheel', label: 'Motijheel Rain', labelBn: 'মতিঝিল' },
            { id: 'mirpur', label: 'Mirpur Fog', labelBn: 'মিরপুর কুয়াশা' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoute(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedRoute === tab.id
                  ? 'bg-[#ffd23f] text-[#120a26] shadow-md'
                  : 'bg-[#1e1338] hover:bg-[#2c1b52] text-[#cbbbe8]'
              }`}
            >
              {lang === 'bn' ? tab.labelBn : tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Entries List */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {loading ? (
            <div className="text-center py-16 text-[#a29bfe] text-sm animate-pulse">
              {lang === 'bn' ? 'স্কোর লোড হচ্ছে...' : 'Loading Global Leaderboard...'}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-[#a29bfe] text-sm">
              {lang === 'bn' ? 'কোন স্কোর পাওয়া যায়নি' : 'No records logged yet. Be the first!'}
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    rank === 1
                      ? 'bg-gradient-to-r from-[#ffd23f]/15 to-[#1a1033] border-[#ffd23f]/40 shadow-[0_0_15px_rgba(255,210,63,0.15)]'
                      : 'bg-[#1b1033] border-[#2f1b57]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base font-black w-8 text-center ${
                        isTop3 ? 'text-xl' : 'text-[#a29bfe] text-xs font-mono'
                      }`}
                    >
                      {medal}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {entry.playerName}
                        </span>
                        <span className="text-[11px] text-[#00e5ff] font-medium px-2 py-0.5 rounded-full bg-[#00e5ff]/10">
                          📍 {entry.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#a29bfe] mt-0.5 font-mono">
                        <span>{entry.distanceKm} km</span>
                        <span>·</span>
                        <span>{entry.timeSec}s</span>
                        <span>·</span>
                        <span className="text-[#ffd23f] uppercase">{entry.skinId} EV</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-[#ffd23f] tabular-nums font-mono">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#a29bfe] font-medium">
                      {lang === 'bn' ? 'পয়েন্ট' : 'PTS'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
