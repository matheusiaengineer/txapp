"use client";

import { motion } from "framer-motion";

export function RadarLoader() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
      {/* Radar rings */}
      <motion.div
        className="absolute w-full h-full border-2 border-primary/40 rounded-full"
        animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-full h-full border-2 border-primary/20 rounded-full"
        animate={{ scale: [1, 2.5, 2.5], opacity: [0.6, 0, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
      />
      
      {/* Radar sweep */}
      <motion.div
        className="absolute w-full h-full rounded-full overflow-hidden"
        style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(62, 203, 142, 0.4) 100%)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Center dot */}
      <div className="absolute w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(62,203,142,0.8)]" />
      
      {/* Blips */}
      <motion.div 
        className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)] top-6 right-8"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.2 }}
      />
      <motion.div 
        className="absolute w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.8)] bottom-8 left-6"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.1 }}
      />
    </div>
  );
}
