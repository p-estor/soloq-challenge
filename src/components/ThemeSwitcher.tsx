'use client';

import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'classic' | 'pro'>('classic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('chupachotas-theme') as 'classic' | 'pro' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'classic' ? 'pro' : 'classic';
    setTheme(newTheme);
    localStorage.setItem('chupachotas-theme', newTheme);
    if (newTheme === 'classic') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'pro');
    }
  };

  if (!mounted) return null;

  return (
    <button 
      onClick={toggleTheme}
      title={`Cambiar a diseño ${theme === 'classic' ? 'Pro' : 'Clásico'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-normal)',
        borderRadius: '6px',
        padding: '0.4rem 0.8rem',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      <Palette size={14} />
      {theme === 'classic' ? 'Modo Pro' : 'Modo Clásico'}
    </button>
  );
}
