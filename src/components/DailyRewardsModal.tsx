import React, { useEffect, useState } from 'react';
import { DailyQuest, DailyReward } from '../types/game';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCoins: (amount: number) => void;
  lang: 'en' | 'bn';
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  onClaimCoins,
  lang,
}) => {
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/challenges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyRewards(data.dailyRewards || []);
          setQuests(data.quests || []);
          setSeason(data.season);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const claimDaily = (day: number, coins: number) => {
    fetch('/api/challenges/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'daily_reward', id: day }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyRewards((prev) =>
            prev.map((d) => (d.day === day ? { ...d, claimed: true } : d))
          );
          onClaimCoins(coins);
        }
      })
      .catch(() => {});
  };

  const claimQuest = (questId: string, coins: number) => {
    fetch('/api/challenges/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'quest', id: questId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuests((prev) =>
            prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
          );
          onClaimCoins(coins);
        }
      })
      .catch(() => {});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-['Hind_Siliguri']">
      <div className="relative w-full max-w-3xl bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d1b54] mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div>
              <h2 className="text-2xl font-black text-[#ffd23f]">
                {lang === 'bn' ? 'দৈনিক পুরস্কার ও সিজন পাস' : 'Daily Rewards & Season Challenges'}
              </h2>
              <p className="text-xs text-[#a29bfe]">
                {lang === 'bn'
                  ? 'প্রতিদিনের লগইন পুরস্কার সংগ্রহ করুন ও মিশন শেষ করে এক্সপি বাড়ান'
                  : 'Claim streak bonuses and complete daily objectives to unlock season tiers'}
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

        {loading ? (
          <div className="text-center py-16 text-[#a29bfe] animate-pulse">Loading Challenges...</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Season Pass Progress Banner */}
            {season && (
              <div className="bg-gradient-to-r from-[#2c1356] via-[#1a0f35] to-[#2b104a] border border-[#5a2e9d] rounded-2xl p-4.5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {lang === 'bn' ? season.nameBn : season.name}
                      </h3>
                      <span className="text-[11px] text-[#00e5ff] font-mono">
                        Tier {season.currentTier} / {season.maxTier} · {season.daysLeft} days left
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#ffd23f] font-mono">
                    {season.currentXp} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-[#110724] rounded-full overflow-hidden border border-[#3b1c6c]">
                  <div
                    className="h-full bg-gradient-to-r from-[#00e5ff] via-[#ffd23f] to-[#ff4fa3]"
                    style={{ width: `${(season.currentTier / season.maxTier) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* 7-Day Login Calendar */}
            <div>
              <h3 className="text-sm font-extrabold text-[#cbbbe8] mb-3">
                {lang === 'bn' ? '৭ দিনের ধারাবাহিক লগইন বোনাস' : '7-DAY LOGIN STREAK REWARDS'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {dailyRewards.map((reward) => (
                  <div
                    key={reward.day}
                    className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-center ${
                      reward.claimed
                        ? 'bg-[#120a22] border-[#29174b] opacity-60'
                        : 'bg-[#1f123d] border-[#4b2c8a] shadow-md hover:border-[#ffd23f]'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-[#a29bfe]">{reward.label}</span>
                    <span className="text-2xl my-1.5">{reward.skinUnlock ? '🏎️' : '🪙'}</span>
                    <span className="text-xs font-black text-[#ffd23f] font-mono">
                      +{reward.coins} ৳
                    </span>
                    <span className="text-[9px] text-[#cbbbe8] mt-0.5 leading-tight line-clamp-1">
                      {reward.bonus}
                    </span>

                    <button
                      disabled={reward.claimed}
                      onClick={() => claimDaily(reward.day, reward.coins)}
                      className={`mt-2.5 w-full py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        reward.claimed
                          ? 'bg-[#291b47] text-[#6d5b94] cursor-default'
                          : 'bg-[#ffd23f] hover:bg-[#ffe27a] text-[#120a26] shadow'
                      }`}
                    >
                      {reward.claimed
                        ? lang === 'bn' ? 'সংগৃহীত' : 'Claimed'
                        : lang === 'bn' ? 'গ্রহণ করুন' : 'Claim'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Quests */}
            <div>
              <h3 className="text-sm font-extrabold text-[#cbbbe8] mb-3">
                {lang === 'bn' ? 'আজকের দৈনিক মিশন' : 'TODAY’S DAILY QUESTS'}
              </h3>

              <div className="flex flex-col gap-2.5">
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#261647] border border-[#44287e] flex items-center justify-center text-lg shrink-0">
                        🎯
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-sm">
                          {lang === 'bn' ? quest.titleBn : quest.title}
                        </div>
                        <p className="text-xs text-[#a29bfe]">
                          {lang === 'bn' ? quest.descriptionBn : quest.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-[#ffd23f] font-mono">
                          +{quest.rewardCoins} ৳
                        </div>
                        <div className="text-[10px] text-[#00e5ff] font-mono">
                          +{quest.rewardXp} XP
                        </div>
                      </div>

                      <button
                        disabled={quest.claimed}
                        onClick={() => claimQuest(quest.id, quest.rewardCoins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          quest.claimed
                            ? 'bg-[#291b47] text-[#6d5b94] cursor-default'
                            : 'bg-[#00e5ff] hover:bg-[#38eeff] text-[#120a26] shadow'
                        }`}
                      >
                        {quest.claimed
                          ? lang === 'bn' ? 'সম্পন্ন' : 'Completed'
                          : lang === 'bn' ? 'সংগ্রহ' : 'Claim'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
