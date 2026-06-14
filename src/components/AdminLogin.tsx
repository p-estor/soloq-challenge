'use client';

import React, { useState, useTransition } from 'react';
import { loginAdminAction } from '@/app/actions';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const res = await loginAdminAction(password);
      if (res.success) {
        router.refresh(); // Reload to refresh server authentication state
      } else {
        setError(res.error || 'Contraseña incorrecta');
      }
    });
  };

  return (
    <div className="glass-panel auth-container">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <ShieldAlert size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
        <h2 className="auth-title">Acceso de Administrador</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Introduce la contraseña para gestionar el SoloQ Challenge
        </p>
      </div>

      {error && (
        <div className="alert-box alert-error" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              placeholder="Contraseña del administrador"
              required
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.25rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <KeyRound
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !password}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isPending ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
