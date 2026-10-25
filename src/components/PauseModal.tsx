import React from 'react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  lang: 'en' | 'bn';
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onExit,
  onToggleSound,
  isMuted,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 font-['Hind_Siliguri']">
      <div className="w-full max-w-sm bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
        <span className="text-4xl mb-2">⏸️</span>
        <h2 className="text-2xl font-black text-[#ffd23f] mb-1">
          {lang === 'bn' ? 'খেলা স্থগিত' : 'GAME PAUSED'}
        </h2>
        <p className="text-xs text-[#a29bfe] mb-6">
          {lang === 'bn'
            ? 'চা বিরতি! প্রস্তুত হলে আবার শুরু করুন'
            : 'Take a quick Cha break and jump back into traffic'}
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-[#ffd23f] hover:bg-[#ffe27a] text-[#120a26] font-black text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            {lang === 'bn' ? 'খেলা চালিয়ে যান (Esc)' : 'RESUME RACE (Esc)'}
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-[#1f133b] hover:bg-[#2c1b52] border border-[#44287e] text-white font-bold text-sm cursor-pointer active:scale-95 transition-all"
          >
            {lang === 'bn' ? 'পুনরায় শুরু করুন' : 'RESTART'}
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-2.5 rounded-xl bg-[#1f133b] hover:bg-[#2c1b52] border border-[#44287e] text-[#cbbbe8] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span>
              {isMuted
                ? lang === 'bn' ? 'শব্দ চালু করুন' : 'Unmute Audio'
                : lang === 'bn' ? 'শব্দ বন্ধ করুন' : 'Mute Audio'}
            </span>
          </button>

          <button
            onClick={onExit}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#d63031]/20 text-[#ff7675] font-bold text-sm cursor-pointer transition-all mt-2"
          >
            {lang === 'bn' ? 'মেন্যুতে ফিরে যান' : 'EXIT TO TITLE'}
          </button>
        </div>
      </div>
    </div>
  );
};
