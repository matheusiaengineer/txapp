"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronRight, Star, Clock, MapPin, DollarSign } from "lucide-react";

interface SwipeToAcceptProps {
  pickup: string;
  destination: string;
  estimatedFare: number;
  distance: string;
  estimatedTime: string;
  passengerName: string;
  passengerRating: number;
  onAccept: () => void;
  onReject: () => void;
  timer: number;
}

export default function SwipeToAccept({
  pickup,
  destination,
  estimatedFare,
  distance,
  estimatedTime,
  passengerName,
  passengerRating,
  onAccept,
  onReject,
  timer,
}: SwipeToAcceptProps) {
  const [accepted, setAccepted] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const thumbScale = useTransform(x, [0, 250, 300], [1, 1.1, 1.2]);
  const progressWidth = useTransform(x, [0, 300], ["0%", "100%"]);
  const showCheck = useTransform(x, [280, 300], [0, 1]);
  const bgOpacity = useTransform(x, [0, 300], [0, 1]);

  const handleDragEnd = useCallback(
    (event: any, info: { offset: { x: number } }) => {
      if (info.offset.x > 280) {
        setAccepted(true);
        setTimeout(onAccept, 400);
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
      }
    },
    [onAccept, x]
  );

  return (
    <motion.div
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 200, opacity: 0 }}
      className="glass-panel rounded-3xl overflow-hidden border-primary/30 shadow-[0_-20px_60px_rgba(62,203,142,0.15)]"
    >
      {/* Timer e valor */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <motion.span
            key={timer}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-bold text-primary"
          >
            {timer}s
          </motion.span>
        </div>
        <div className="text-2xl font-bold text-white">
          R$ <span className="text-primary">{estimatedFare.toFixed(2)}</span>
        </div>
      </div>

      {/* Rotas */}
      <div className="px-6 space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
            <div className="w-0.5 h-8 bg-primary/30" />
            <div className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{pickup}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">{destination}</div>
          </div>
          <div className="text-right text-xs text-gray-500 shrink-0">
            <div>{distance}</div>
            <div>{estimatedTime}</div>
          </div>
        </div>
      </div>

      {/* Info do passageiro */}
      <div className="mx-6 mb-4 flex items-center gap-3 p-3 bg-background rounded-xl border border-card-border">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
          {passengerName.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{passengerName}</p>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-yellow-400">{passengerRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Swipe to Accept */}
      <div className="px-6 pb-5">
        <div
          ref={constraintsRef}
          className="relative h-14 bg-background rounded-full border border-card-border overflow-hidden"
        >
          {/* Progress background */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: progressWidth,
              background: "linear-gradient(90deg, rgba(62,203,142,0.2), rgba(62,203,142,0.4))",
            }}
          />

          {/* Texto de fundo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-xs text-gray-500 font-medium flex items-center gap-2"
              style={{ opacity: useTransform(x, [0, 200], [0.6, 0]) }}
            >
              <span className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                <ChevronRight className="w-3 h-3" />
              </span>
              Deslize para aceitar
            </motion.span>
            <motion.span
              className="text-xs text-primary font-bold"
              style={{ opacity: showCheck }}
            >
              ✓ Aceitar
            </motion.span>
          </div>

          {/* Thumb deslizante */}
          <motion.div
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            style={{ x, scale: thumbScale }}
            onDragEnd={handleDragEnd}
            className="absolute top-1 left-1 w-12 h-12 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg shadow-primary/30 z-10"
          >
            <motion.div style={{ scale: showCheck }}>
              <ChevronRight className="w-5 h-5 text-background" />
            </motion.div>
          </motion.div>
        </div>

        {/* Botão recusar */}
        <button
          onClick={onReject}
          className="w-full mt-2 py-3 rounded-xl text-sm text-gray-400 hover:text-red-400 transition-colors text-center"
        >
          Recusar corrida
        </button>
      </div>
    </motion.div>
  );
}
