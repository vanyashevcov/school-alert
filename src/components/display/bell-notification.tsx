
'use client';

import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function BellNotification({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div className="bg-primary/90 text-primary-foreground p-8 rounded-2xl shadow-2xl max-w-2xl text-center backdrop-blur-sm border-2 border-primary-foreground/20">
            <Bell className="h-16 w-16 mx-auto mb-4 text-amber-300" />
            <p className="text-4xl font-bold">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
