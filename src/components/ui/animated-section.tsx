"use client";

import { motion } from "framer-motion";

const easing = [0.16, 1, 0.3, 1] as const;

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
}

const directionMap = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
};

export function AnimatedSection({ children, className = "", delay = 0, direction = "up", distance = 30, duration = 0.6 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: easing }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerSectionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerSection({ children, className = "", staggerDelay = 0.08 }: StaggerSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { ease: easing, duration: 0.5 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
