import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Participant, WheelSettings } from '../types';
import { getSegmentColor } from '../utils/theme';
import { soundEffects } from '../utils/sound';
import { Play, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface RouletteWheelProps {
  participants: Participant[];
  settings: WheelSettings;
  onSpinStart: () => void;
  onSpinEnd: (winner: Participant) => void;
  isSpinning: boolean;
  onToggleSound: () => void;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  participants,
  settings,
  onSpinStart,
  onSpinEnd,
  isSpinning,
  onToggleSound,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [tickerAngle, setTickerAngle] = useState<number>(0);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const lastTickSegmentRef = useRef<number>(-1);

  const total = participants.length;
  const sliceAngle = total > 0 ? 360 / total : 360;

  const getIndexAtPointer = useCallback(
    (rotDeg: number) => {
      if (total === 0) return -1;
      const normalizedRot = ((270 - rotDeg) % 360 + 360) % 360;
      const index = Math.floor(normalizedRot / sliceAngle) % total;
      return index;
    },
    [total, sliceAngle]
  );

  const handleSpin = useCallback(() => {
    if (isSpinning || total === 0) return;
    onSpinStart();
    setHighlightedIndex(null);

    const winningIndex = Math.floor(Math.random() * total);
    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
    const desiredPointerAngle = ((270 - sliceCenterAngle) % 360 + 360) % 360;

    const currentRot = rotation;
    const currentRotNorm = ((currentRot % 360) + 360) % 360;

    let extraDegrees = desiredPointerAngle - currentRotNorm;
    if (extraDegrees < 0) extraDegrees += 360;

    const fullTurns = 6 + Math.floor(Math.random() * 3);
    const totalAddedRotation = fullTurns * 360 + extraDegrees;

    startRotationRef.current = currentRot;
    targetRotationRef.current = currentRot + totalAddedRotation;
    startTimeRef.current = performance.now();
    lastTickSegmentRef.current = getIndexAtPointer(currentRot);

    const durationMs = settings.spinDurationSeconds * 1000;
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const newRotation =
        startRotationRef.current +
        (targetRotationRef.current - startRotationRef.current) * easedProgress;

      setRotation(newRotation);

      const currentSegment = getIndexAtPointer(newRotation);
      if (currentSegment !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentSegment;
        const speedFactor = 1 - progress;
        soundEffects.playTick(0.8 + speedFactor * 0.5);
        setTickerAngle(-15 * speedFactor);
        setTimeout(() => setTickerAngle(0), 40);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const finalWinnerIndex = getIndexAtPointer(newRotation);
        setHighlightedIndex(finalWinnerIndex);
        const winner = participants[finalWinnerIndex];
        if (winner) {
          onSpinEnd(winner);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isSpinning, total, onSpinStart, rotation, sliceAngle, settings.spinDurationSeconds, getIndexAtPointer, participants, onSpinEnd]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && total > 0) {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          handleSpin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin, isSpinning, total]);

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180.0;
    const endRad = ((endAngle - 90) * Math.PI) / 180.0;
    const x1 = x + radius * Math.cos(startRad);
    const y1 = y + radius * Math.sin(startRad);
    const x2 = x + radius * Math.cos(endRad);
    const y2 = y + radius * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', x, y,
      'L', x1, y1,
      'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
      'Z',
    ].join(' ');
  };

  const center = 250;
  const radius = 230;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Top controls / Sound toggle */}
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
        <button
          onClick={onToggleSound}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full border border-slate-700 backdrop-blur transition-all shadow-md cursor-pointer"
          title={settings.soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Wheel Wrapper */}
      <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
        {/* Outer Glow / Chrome Ring con verde UTH */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#006837]/30 via-emerald-500/20 to-[#FFC60B]/20 animate-pulse blur-xl opacity-70" />
        <div className="relative w-full h-full p-2 bg-slate-900/90 rounded-full border-4 border-[#006837] shadow-2xl backdrop-blur-md flex items-center justify-center">
          
          {/* Top Pointer / Ticker Arrow */}
          <div
            className="absolute top-[-10px] z-30 flex flex-col items-center transition-transform duration-75 origin-bottom"
            style={{ transform: `rotate(${tickerAngle}deg)` }}
          >
            <div className="w-8 h-10 bg-gradient-to-b from-[#FFC60B] to-yellow-600 rounded-b-lg shadow-lg clip-triangle border border-yellow-200 flex items-center justify-center">
              <div className="w-2 h-4 bg-yellow-100 rounded-full" />
            </div>
          </div>

          {/* SVG Wheel Canvas */}
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400 z-10">
              <RotateCcw className="w-12 h-12 mb-3 text-slate-500 animate-spin-slow" />
              <p className="font-medium text-lg text-slate-300">Cargando participantes...</p>
              <p className="text-xs text-slate-500 mt-1">Conecta con Google Sheets para comenzar</p>
            </div>
          ) : (
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full transition-transform ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
                </filter>
              </defs>
              <g>
                {participants.map((p, index) => {
                  const startAngle = index * sliceAngle;
                  const endAngle = (index + 1) * sliceAngle;
                  const isHighlighted = highlightedIndex === index;
                  const fillColor = getSegmentColor(index, total, settings.theme);

                  const midAngle = startAngle + sliceAngle / 2;
                  const textRad = ((midAngle - 90) * Math.PI) / 180;
                  const textDist = radius * 0.65;
                  const textX = center + textDist * Math.cos(textRad);
                  const textY = center + textDist * Math.sin(textRad);

                  let textRotate = midAngle;
                  if (midAngle > 90 && midAngle < 270) {
                    textRotate += 180;
                  }

                  const maxChar = total > 30 ? 10 : total > 15 ? 16 : 24;
                  const truncatedName =
                    p.name.length > maxChar ? p.name.substring(0, maxChar - 1) + ' ' : p.name;

                  return (
                    <g key={p.id || index}>
                      <path
                        d={describeArc(center, center, radius, startAngle, endAngle)}
                        fill={fillColor}
                        stroke="#0f172a"
                        strokeWidth="2.5"
                        className={`transition-opacity duration-300 ${
                          isHighlighted ? 'brightness-125 stroke-[#FFC60B] stroke-[4]' : ''
                        }`}
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="#ffffff"
                        fontSize={total > 40 ? '10' : total > 20 ? '12' : total > 10 ? '14' : '16'}
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${textRotate}, ${textX}, ${textY})`}
                        filter="url(#shadow)"
                        className="select-none pointer-events-none font-sans"
                        style={{
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {truncatedName}
                      </text>
                    </g>
                  );
                })}
              </g>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#006837"
                strokeWidth="6"
                className="opacity-90"
              />
            </svg>
          )}

          {/* Center Hub & Spin Button en Verde/Dorado UTH */}
          {total > 0 && (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#FFC60B] bg-gradient-to-br from-[#005028] via-[#006837] to-slate-900 text-[#FFC60B] font-extrabold flex flex-col items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer select-none ${
                isSpinning
                  ? 'opacity-80 cursor-not-allowed scale-95 border-slate-600 text-slate-400'
                  : 'hover:border-yellow-300 hover:shadow-emerald-500/50'
              }`}
            >
              {isSpinning ? (
                <div className="flex flex-col items-center">
                  <Sparkles className="w-7 h-7 text-[#FFC60B] animate-spin" />
                  <span className="text-[10px] tracking-widest text-emerald-200 uppercase font-semibold mt-1">
                    GIRANDO
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Play className="w-7 h-7 fill-[#FFC60B] text-[#FFC60B] ml-1 mb-0.5" />
                  <span className="text-xs sm:text-sm tracking-wider font-black text-white uppercase">
                    GIRAR!
                  </span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Help text below wheel */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/60">
        <span>Presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-emerald-300 font-mono text-[11px]">Espacio</kbd> o el botón central para girar</span>
      </div>
    </div>
  );
};