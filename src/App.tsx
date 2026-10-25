/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { GarageModal } from './components/GarageModal';
import { HUD } from './components/HUD';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MobileControls } from './components/MobileControls';
import { MultiplayerModal } from './components/MultiplayerModal';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { GAME_ROUTES } from './data/routes';
import { sound } from './game/AudioSynthesizer';
import { GameEngine, GameOverResult } from './game/GameEngine';
import { MultiplayerClient } from './game/MultiplayerClient';
import { SKINS } from './game/RickshawArt';
import { DynamicWeatherState, GhostComparison, PlayerUpgrades, RickshawSkin, RouteConfig } from './types/game';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [lang, setLang] = useState<'en' | 'bn'>('bn'); // Authentic default
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Gameplay State
  const [selectedRoute, setSelectedRoute] = useState<RouteConfig>(GAME_ROUTES[0]);
  const [selectedSkin, setSelectedSkin] = useState<RickshawSkin>(SKINS.tesla);
  const [coins, setCoins] = useState<number>(500); // Starter Taka
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    motorLevel: 1,
    batteryLevel: 1,
    regenLevel: 1,
    bellLevel: 1,
  });

  // Real-time HUD Metrics
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [batteryPercent, setBatteryPercent] = useState<number>(100);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [gameCoins, setGameCoins] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState<number>(0);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [boostCooldown, setBoostCooldown] = useState<number>(0);
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);
  const [bellCooldown, setBellCooldown] = useState<number>(0);
  const [currentWeather, setCurrentWeather] = useState<DynamicWeatherState | undefined>(undefined);

  // Ghost Mode State (Personal Best Shadow)
  const [ghostComparison, setGhostComparison] = useState<GhostComparison | null>(null);
  const [isGhostEnabled, setIsGhostEnabled] = useState<boolean>(true);

  // Game Over Result
  const [gameResult, setGameResult] = useState<GameOverResult | null>(null);

  // Modals Visibility
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState<boolean>(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);

  // Multiplayer State
  const [multiplayerRoom, setMultiplayerRoom] = useState<any | null>(null);
  const multiplayerClientRef = useRef<MultiplayerClient | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Detect Touch / Mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Multiplayer Client
  useEffect(() => {
    const client = new MultiplayerClient({
      onRoomCreated: (room) => {
        setMultiplayerRoom(room);
      },
      onRoomUpdated: (room) => {
        setMultiplayerRoom(room);
      },
      onCountdownStart: (count) => {
        engineRef.current?.addFloatingText(`Race Starts in ${count}...`, 100, 480, '#ffd23f');
      },
      onRaceStart: () => {
        setIsMultiplayerOpen(false);
        setAppState('playing');
        engineRef.current?.start();
      },
      onPlayerUpdate: (pid, state) => {
        if (!engineRef.current) return;
        // Update opponent's position in live game engine
        const existingRival = engineRef.current.traffic.find(
          (t) => t.kind === 'rival' && t.rivalName?.startsWith(pid.slice(-4))
        );
        if (existingRival) {
          existingRival.x = state.x;
          existingRival.y = state.lane * 80 + 400;
          existingRival.vx = state.speed;
        } else {
          engineRef.current.traffic.push({
            id: Math.random(),
            kind: 'rival',
            x: state.x,
            lane: state.lane,
            y: state.lane * 80 + 400,
            vx: state.speed,
            rivalSkin: SKINS.peacock,
            rivalName: `Player_${pid.slice(-4)}`,
          });
        }
      },
      onPlayerBell: (_pid, text) => {
        engineRef.current?.addFloatingText(text, 250, 420, '#ffd23f');
        sound.playBell();
      },
      onPlayerFinish: (_pid, name, timeSec) => {
        engineRef.current?.addFloatingText(`🏁 ${name} finished in ${timeSec}s!`, 300, 400, '#00e5ff');
      },
    });

    client.connect();
    multiplayerClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, []);

  // Game Engine Events Listener
  const gameEngineEvents = {
    onScoreUpdate: (newScore: number, newCoins: number, newDistKm: number) => {
      setScore(newScore);
      setGameCoins(newCoins);
      setDistanceKm(newDistKm);
      if (engineRef.current) {
        setElapsedTimeSec(Math.floor(engineRef.current.elapsedTimeSec));
        setBoostCooldown(engineRef.current.boostCooldown);
        setBoostTimeLeft(engineRef.current.boostTimeLeft);
        setBellCooldown(engineRef.current.bellCooldown);

        // Sync with multiplayer room if active
        if (multiplayerRoom && multiplayerClientRef.current) {
          multiplayerClientRef.current.syncState({
            x: engineRef.current.heroX,
            lane: engineRef.current.heroLane,
            speed: engineRef.current.heroSpeed,
            battery: engineRef.current.heroBattery,
            isBoosting: engineRef.current.boostTimeLeft > 0,
            isBraking: engineRef.current.input.brake,
            bellRung: false,
          });
        }
      }
    },
    onBatteryUpdate: (battery: number, isRegen: boolean) => {
      setBatteryPercent(battery);
      setIsRegenerating(isRegen);
    },
    onSpeedUpdate: (speed: number) => {
      setSpeedKmh(speed);
    },
    onDraftingUpdate: (drafting: boolean) => {
      setIsDrafting(drafting);
    },
    onWeatherUpdate: (weather: DynamicWeatherState) => {
      setCurrentWeather({ ...weather });
    },
    onGhostUpdate: (comp: GhostComparison) => {
      setGhostComparison({ ...comp });
    },
    onBellTriggered: () => {
      if (multiplayerRoom && multiplayerClientRef.current) {
        multiplayerClientRef.current.sendBellTaunt();
      }
    },
    onGameOver: (result: GameOverResult) => {
      setGameResult(result);
      setCoins((prev) => prev + result.coins);
      setAppState('gameover');
      if (multiplayerRoom && multiplayerClientRef.current) {
        multiplayerClientRef.current.sendFinished(result.timeSec);
      }
    },
  };

  const handleToggleGhost = () => {
    if (engineRef.current) {
      const next = engineRef.current.toggleGhostMode();
      setIsGhostEnabled(next);
    } else {
      setIsGhostEnabled((prev) => !prev);
    }
  };

  const handleStartStory = (route: RouteConfig) => {
    setSelectedRoute(route);
    setGhostComparison(null);
    setAppState('playing');
    setTimeout(() => {
      engineRef.current?.resetState();
      engineRef.current?.start();
    }, 50);
  };

  const handleStartEndless = () => {
    const endlessRoute = GAME_ROUTES.find((r) => r.id === 'endless') || GAME_ROUTES[0];
    setSelectedRoute(endlessRoute);
    setGhostComparison(null);
    setAppState('playing');
    setTimeout(() => {
      engineRef.current?.resetState();
      engineRef.current?.start();
    }, 50);
  };

  const handlePause = () => {
    if (appState === 'playing') {
      engineRef.current?.pause();
      setAppState('paused');
    }
  };

  const handleResume = () => {
    if (appState === 'paused') {
      engineRef.current?.resume();
      setAppState('playing');
    }
  };

  const handleRestart = () => {
    setGhostComparison(null);
    setAppState('playing');
    engineRef.current?.resetState();
    engineRef.current?.start();
  };

  const handleExitToTitle = () => {
    engineRef.current?.stop();
    setAppState('title');
  };

  const handleToggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sound.setMute(newMuted);
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const handleUpgrade = (type: keyof PlayerUpgrades, cost: number) => {
    if (coins < cost) return;
    setCoins((prev) => prev - cost);
    setUpgrades((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
    if (engineRef.current) {
      engineRef.current.upgrades[type] += 1;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0614] select-none font-['Hind_Siliguri']">
      {/* 1. Underlying Game Canvas (Runs isolated 60fps simulation loop) */}
      <GameCanvas
        route={selectedRoute}
        skin={selectedSkin}
        upgrades={upgrades}
        events={gameEngineEvents}
        onEngineReady={(engine) => {
          engineRef.current = engine;
        }}
        onPauseToggle={() => {
          if (appState === 'playing') handlePause();
          else if (appState === 'paused') handleResume();
        }}
      />

      {/* 2. Title Screen (Atmospheric overlay on top of active canvas preview) */}
      {appState === 'title' && (
        <TitleScreen
          onStartStory={handleStartStory}
          onStartEndless={handleStartEndless}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
          onToggleSound={handleToggleSound}
          isMuted={isMuted}
          lang={lang}
          onToggleLang={handleToggleLang}
          routes={GAME_ROUTES}
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
        />
      )}

      {/* 3. In-Game Low-Occlusion HUD */}
      {(appState === 'playing' || appState === 'paused') && (
        <HUD
          speedKmh={speedKmh}
          batteryPercent={batteryPercent}
          isRegenerating={isRegenerating}
          distanceKm={distanceKm}
          route={selectedRoute}
          coins={gameCoins}
          score={score}
          elapsedTimeSec={elapsedTimeSec}
          isDrafting={isDrafting}
          boostCooldown={boostCooldown}
          boostTimeLeft={boostTimeLeft}
          bellCooldown={bellCooldown}
          weather={currentWeather}
          onCycleWeather={() => engineRef.current?.cycleWeather()}
          ghostComparison={ghostComparison}
          isGhostEnabled={isGhostEnabled}
          onToggleGhost={handleToggleGhost}
          lang={lang}
          onPause={handlePause}
          onBell={() => engineRef.current?.triggerBell()}
          onBoost={() => engineRef.current?.triggerBoost()}
        />
      )}

      {/* 4. Mobile / Touch Controls Overlay */}
      {appState === 'playing' && isMobile && (
        <MobileControls
          onThrottleChange={(active) => {
            if (engineRef.current) engineRef.current.input.throttle = active;
          }}
          onBrakeChange={(active) => {
            if (engineRef.current) engineRef.current.input.brake = active;
          }}
          onLaneChange={(direction) => {
            engineRef.current?.switchLane(direction);
          }}
          onBell={() => engineRef.current?.triggerBell()}
          onBoost={() => engineRef.current?.triggerBoost()}
          lang={lang}
        />
      )}

      {/* 5. Garage Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        coins={coins}
        upgrades={upgrades}
        onUpgrade={handleUpgrade}
        selectedSkin={selectedSkin}
        onSelectSkin={setSelectedSkin}
        lang={lang}
      />

      {/* 6. Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        lang={lang}
      />

      {/* 7. Daily Rewards & Quests Modal */}
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
        onClaimCoins={(amount) => setCoins((prev) => prev + amount)}
        lang={lang}
      />

      {/* 8. Cross-Platform Multiplayer Lobby Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        onCreateRoom={(name, routeId) => {
          multiplayerClientRef.current?.createRoom(name, routeId, selectedSkin.id);
        }}
        onJoinRoom={(name, code) => {
          multiplayerClientRef.current?.joinRoom(name, code, selectedSkin.id);
        }}
        onStartRace={() => {
          multiplayerClientRef.current?.startRace();
        }}
        currentRoom={multiplayerRoom}
        playerId={multiplayerClientRef.current?.playerId || ''}
        routes={GAME_ROUTES}
        lang={lang}
      />

      {/* 9. Pause Modal */}
      <PauseModal
        isOpen={appState === 'paused'}
        onResume={handleResume}
        onRestart={handleRestart}
        onExit={handleExitToTitle}
        onToggleSound={handleToggleSound}
        isMuted={isMuted}
        lang={lang}
      />

      {/* 10. Game Over Modal */}
      <GameOverModal
        isOpen={appState === 'gameover'}
        result={gameResult}
        route={selectedRoute}
        onRetry={handleRestart}
        onExit={handleExitToTitle}
        lang={lang}
      />
    </div>
  );
}
