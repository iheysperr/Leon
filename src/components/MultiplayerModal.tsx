import React, { useState } from 'react';
import { RouteConfig } from '../types/game';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (playerName: string, routeId: string) => void;
  onJoinRoom: (playerName: string, roomCode: string) => void;
  onStartRace: () => void;
  currentRoom: any | null;
  playerId: string;
  routes: RouteConfig[];
  lang: 'en' | 'bn';
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onStartRace,
  currentRoom,
  playerId,
  routes,
  lang,
}) => {
  const [playerName, setPlayerName] = useState<string>('DhakaRacer');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('farmgate');

  if (!isOpen) return null;

  const isHost = currentRoom && currentRoom.hostId === playerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-['Hind_Siliguri']">
      <div className="relative w-full max-w-2xl bg-[#140c28] border border-[#3b236e] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d1b54] mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <h2 className="text-2xl font-black text-[#00e5ff]">
                {lang === 'bn' ? 'অনলাইন মাল্টিপ্লেয়ার রেস' : 'Live Cross-Platform Multiplayer'}
              </h2>
              <p className="text-xs text-[#a29bfe]">
                {lang === 'bn'
                  ? 'বন্ধু বা অন্যান্য খেলোয়াড়দের সাথে রিয়েল-টাইমে ঢাকা ট্রাফিকে রেস করুন'
                  : 'Compete in synchronized real-time races across desktop and mobile'}
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

        {/* Room View (if in room) */}
        {currentRoom ? (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#a29bfe] font-bold">
                  {lang === 'bn' ? 'রুম কোড:' : 'ROOM CODE:'}
                </span>
                <div className="text-3xl font-black text-[#ffd23f] tracking-widest font-mono">
                  {currentRoom.code}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#a29bfe] font-bold">
                  {lang === 'bn' ? 'স্ট্যাটাস:' : 'STATUS:'}
                </span>
                <div className="text-sm font-bold text-[#00e5ff] uppercase">
                  {currentRoom.status}
                </div>
              </div>
            </div>

            {/* Players in Room */}
            <div>
              <h3 className="text-sm font-bold text-[#cbbbe8] mb-3">
                {lang === 'bn'
                  ? `খেলোয়াড়গণ (${currentRoom.players.length}/4)`
                  : `Racers in Room (${currentRoom.players.length}/4)`}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentRoom.players.map((p: any, idx: number) => {
                  const isMe = p.id === playerId;
                  const isRoomHost = p.id === currentRoom.hostId;
                  return (
                    <div
                      key={p.id || idx}
                      className="bg-[#1e1338] border border-[#3e276e] rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🏎️</span>
                        <div>
                          <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isMe && (
                              <span className="text-[10px] text-[#ffd23f] font-normal">
                                ({lang === 'bn' ? 'আপনি' : 'You'})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#a29bfe] uppercase font-mono">
                            {p.skinId} EV {isRoomHost ? '· HOST' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Host Action or Waiting Message */}
            <div className="mt-4 pt-4 border-t border-[#2d1b54] flex items-center justify-between">
              <span className="text-xs text-[#a29bfe]">
                {isHost
                  ? lang === 'bn'
                    ? 'আপনি হোস্ট। প্রস্তুত হলে রেস শুরু করুন!'
                    : 'You are host. Start race when players are ready!'
                  : lang === 'bn'
                  ? 'হোস্টের রেস শুরুর অপেক্ষা...'
                  : 'Waiting for host to start countdown...'}
              </span>

              {isHost && (
                <button
                  onClick={onStartRace}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b894] text-[#120a26] font-black text-sm tracking-wide shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'রেস শুরু করুন!' : 'START RACE!'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Create / Join Room Forms */
          <div className="flex flex-col gap-6">
            {/* Player Nickname Input */}
            <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-4">
              <label className="text-xs text-[#a29bfe] font-bold block mb-1.5">
                {lang === 'bn' ? 'আপনার ড্রাইভারের নাম:' : 'YOUR RACER CALLSIGN:'}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={18}
                className="w-full bg-[#110724] border border-[#3b1c6c] rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-[#00e5ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Create Room Box */}
              <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base mb-1">
                    {lang === 'bn' ? 'নতুন রুম খুলুন' : 'Create Custom Room'}
                  </h3>
                  <p className="text-xs text-[#a29bfe] mb-4">
                    {lang === 'bn'
                      ? 'একটি রুম কোড পাবেন যা বন্ধুদের পাঠিয়ে একসাথে খেলবেন'
                      : 'Generate a 4-letter room code to race friends'}
                  </p>

                  <label className="text-[11px] text-[#a29bfe] font-bold block mb-1">
                    {lang === 'bn' ? 'রুট:' : 'TRACK:'}
                  </label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full bg-[#110724] border border-[#3b1c6c] rounded-xl px-3 py-2 text-white text-xs font-bold mb-4"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {lang === 'bn' ? r.nameBn : r.name} ({r.km === Infinity ? '∞' : `${r.km} km`})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => onCreateRoom(playerName, selectedRouteId)}
                  className="w-full py-2.5 rounded-xl bg-[#00e5ff] hover:bg-[#33ebff] text-[#120a26] font-black text-sm cursor-pointer shadow transition-all active:scale-95"
                >
                  {lang === 'bn' ? 'রুম তৈরি করুন' : 'CREATE ROOM'}
                </button>
              </div>

              {/* Join Room Box */}
              <div className="bg-[#1b1033] border border-[#301c59] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base mb-1">
                    {lang === 'bn' ? 'রুমে যোগ দিন' : 'Join with Code'}
                  </h3>
                  <p className="text-xs text-[#a29bfe] mb-4">
                    {lang === 'bn'
                      ? 'বন্ধুর দেওয়া ৪ অক্ষরের রুম কোড প্রবেশ করুন'
                      : 'Enter a 4-letter code to join an active lobby'}
                  </p>

                  <label className="text-[11px] text-[#a29bfe] font-bold block mb-1">
                    {lang === 'bn' ? 'রুম কোড:' : 'ROOM CODE:'}
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. DHAK"
                    maxLength={4}
                    className="w-full bg-[#110724] border border-[#3b1c6c] rounded-xl px-3.5 py-2 text-[#ffd23f] font-black text-center text-lg tracking-widest font-mono focus:outline-none focus:border-[#ffd23f] mb-4"
                  />
                </div>

                <button
                  disabled={roomCodeInput.length < 2}
                  onClick={() => onJoinRoom(playerName, roomCodeInput)}
                  className="w-full py-2.5 rounded-xl bg-[#ffd23f] disabled:bg-[#352554] hover:bg-[#ffe27a] text-[#120a26] disabled:text-[#67548a] font-black text-sm cursor-pointer disabled:cursor-not-allowed shadow transition-all active:scale-95"
                >
                  {lang === 'bn' ? 'রুমে প্রবেশ করুন' : 'JOIN ROOM'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
