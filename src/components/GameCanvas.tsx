import React, { useEffect, useRef } from 'react';
import { GameEngine, GameEngineEvents } from '../game/GameEngine';
import { PlayerUpgrades, RickshawSkin, RouteConfig } from '../types/game';

interface GameCanvasProps {
  route: RouteConfig;
  skin: RickshawSkin;
  upgrades: PlayerUpgrades;
  events: GameEngineEvents;
  onEngineReady: (engine: GameEngine) => void;
  onPauseToggle: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  route,
  skin,
  upgrades,
  events,
  onEngineReady,
  onPauseToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initialize Canvas and GameEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle responsive pixel ratio & size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const engine = new GameEngine(canvas, route, skin, upgrades, events);
    engineRef.current = engine;
    onEngineReady(engine);

    // Keyboard inputs handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        engine.switchLane('up');
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        engine.switchLane('down');
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engine.input.throttle = true;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engine.input.brake = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        engine.triggerBoost();
      } else if (e.code === 'KeyB') {
        engine.triggerBell();
      } else if (e.code === 'KeyG') {
        const enabled = engine.toggleGhostMode();
        engine.addFloatingText(enabled ? '👻 Ghost Mode: ON' : '👻 Ghost Mode: OFF', 220, 420, '#00f2fe');
      } else if (e.code === 'Escape') {
        onPauseToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engine.input.throttle = false;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engine.input.brake = false;
      }
    };

    const handleBlur = () => {
      // Clear held keys on window blur per Game Craft constitution
      engine.input.throttle = false;
      engine.input.brake = false;
      engine.input.left = false;
      engine.input.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      engine.stop();
    };
  }, [route, skin]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-[#0d0820]"
    />
  );
};
