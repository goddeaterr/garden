'use client';

import { motion } from 'framer-motion';

interface Props {
  /** px diameter of the whole spinner. Default 52 */
  size?: number;
  label?: string;
}

/**
 * Compact branded loading indicator — spinning dashed ring +
 * tree path that draws then resets on loop. Drop it anywhere a
 * loading / sending state needs a visual.
 */
export function BrandedSpinner({ size = 52, label }: Props) {
  const s = size;
  const cx = s / 2;
  const r  = s * 0.44;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: s, height: s }}>

        {/* Spinning dashed orbit */}
        <motion.svg
          className="absolute inset-0"
          width={s} height={s} viewBox={`0 0 ${s} ${s}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx={cx} cy={cx} r={r}
            stroke="rgba(113,158,114,0.35)" strokeWidth="1.2"
            fill="none" strokeDasharray="3 9" />
        </motion.svg>

        {/* Counter-rotating inner ring */}
        <motion.svg
          className="absolute inset-0"
          width={s} height={s} viewBox={`0 0 ${s} ${s}`}
          animate={{ rotate: -360 }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx={cx} cy={cx} r={r * 0.68}
            stroke="rgba(113,158,114,0.18)" strokeWidth="1"
            fill="none" strokeDasharray="2 7" />
        </motion.svg>

        {/* Breathing glow */}
        <motion.div className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(80,129,83,0.32) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Tree SVG — draws then loops */}
        <svg className="absolute inset-0" width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          {/* Trunk + crown */}
          <motion.path
            d={`M${cx} ${s*0.88} L${cx} ${s*0.52} M${cx} ${s*0.52} Q${cx*0.58} ${s*0.34} ${cx*0.58} ${s*0.18} Q${cx*0.58} ${s*0.04} ${cx} ${s*0.04} Q${cx*1.42} ${s*0.04} ${cx*1.42} ${s*0.18} Q${cx*1.42} ${s*0.34} ${cx} ${s*0.52}`}
            stroke="rgba(181,218,182,0.90)" strokeWidth={s * 0.038}
            strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 2.8, times: [0, 0.5, 0.8, 1], repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' }}
          />
          {/* Left branch */}
          <motion.path
            d={`M${cx} ${s*0.62} Q${cx*0.7} ${s*0.54} ${cx*0.58} ${s*0.44}`}
            stroke="rgba(181,218,182,0.45)" strokeWidth={s * 0.028}
            strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 0, 1, 1, 0] }}
            transition={{ duration: 2.8, times: [0, 0.45, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' }}
          />
          {/* Right branch */}
          <motion.path
            d={`M${cx} ${s*0.70} Q${cx*1.3} ${s*0.62} ${cx*1.42} ${s*0.52}`}
            stroke="rgba(181,218,182,0.45)" strokeWidth={s * 0.028}
            strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 0, 1, 1, 0] }}
            transition={{ duration: 2.8, times: [0, 0.5, 0.65, 0.8, 1], repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      {label && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[12px] font-medium text-forest-500 dark:text-forest-400 tracking-wide"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
