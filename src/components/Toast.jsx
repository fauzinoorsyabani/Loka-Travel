import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="toast-banner"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-16 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:max-w-sm bg-[#0B3B68] text-white px-5 py-3.5 rounded-xl shadow-lg text-xs font-medium border border-white/10"
        >
          <span id="toast-message">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
