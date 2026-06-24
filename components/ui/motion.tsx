"use client";

import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";

export { motion, AnimatePresence };

const springTransition: Transition = { type: "spring", stiffness: 400, damping: 30 };
const springLazyTransition: Transition = { type: "spring", stiffness: 250, damping: 28 };

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: springTransition },
};

export const spring = springTransition;
export const springLazy = springLazyTransition;
