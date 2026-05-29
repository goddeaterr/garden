'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform"
    >
      <motion.div
        key={dark ? 'moon' : 'sun'}
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </button>
  );
}
