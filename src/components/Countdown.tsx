'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Calendar } from 'lucide-react';

interface CountdownProps {
  targetDate: string; // ISO format or string parsable by Date
  eventName?: string;
  title?: string;
  badgeText?: string;
}

export default function Countdown({ 
  targetDate, 
  eventName = 'SoloQ Challenge',
  title = 'Cuenta Atrás para el Fin del Reto',
  badgeText = '7 de Julio, 2026 - 23:59'
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    // Avoid layout shifts by rendering a skeleton or placeholder with matching dimensions
    return (
      <div className="glass-panel countdown-container loading" style={{ minHeight: '120px', marginBottom: '2rem' }}>
        <div className="countdown-loading-placeholder">Cargando cuenta atrás...</div>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="glass-panel countdown-container expired-container animate-pulse-glow" style={{ marginBottom: '2rem' }}>
        <div className="countdown-header">
          <Timer className="countdown-icon" style={{ color: 'var(--win-color)' }} />
          <span className="countdown-title">¡El evento {eventName} ha finalizado!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel countdown-container" style={{ marginBottom: '2rem' }}>
      <div className="countdown-header-wrapper">
        <div className="countdown-header">
          <Calendar className="countdown-icon text-glow-cyan" size={20} />
          <span className="countdown-title">{title}</span>
        </div>
        {badgeText && (
          <div className="countdown-date-badge">
            {badgeText}
          </div>
        )}
      </div>

      <div className="countdown-grid">
        <div className="countdown-item">
          <span className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="countdown-label">Días</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-label">Horas</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-label">Minutos</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-item">
          <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-label">Segundos</span>
        </div>
      </div>
    </div>
  );
}
