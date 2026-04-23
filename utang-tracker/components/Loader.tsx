'use client';

import { motion } from 'framer-motion';
import { colors, fonts, spacing } from '@/lib/design';

export default function Loader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: fonts.dmSans,
    }}>
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        style={{
          fontSize: '64px',
          marginBottom: spacing.lg,
        }}
      >
        ₱
      </motion.div>

      <motion.div
        animate={{
          width: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        style={{
          height: '3px',
          width: '100px',
          background: `linear-gradient(90deg, ${colors.brand}, #06b6d4, ${colors.brand})`,
          borderRadius: '2px',
        }}
      />

      <p style={{
        marginTop: spacing.lg,
        color: colors.mutedLight,
        fontSize: '14px',
        margin: 0,
      }}>
        Loading...
      </p>
    </div>
  );
}
