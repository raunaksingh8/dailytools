import React, { useState, useCallback, useEffect } from 'react';

/* ─── Toast hook ─── */

let _showToast = null;

/**
 * Call this hook inside any component that wants to trigger toasts.
 * It returns a single `toast(message, type?)` function.
 */
export function useToast() {
  return useCallback((message, type = 'error') => {
    if (_showToast) _showToast(message, type);
  }, []);
}

/* ─── Toast Provider (mount once at the app root) ─── */

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _showToast = (message, type = 'error') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    return () => { _showToast = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
        pointerEvents: 'none',
        width: 'min(400px, calc(100vw - 2rem))',
      }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  );
}

/* ─── Individual Toast ─── */

function Toast({ message, type }) {
  const colors = {
    error:   { bg: 'var(--error-bg)',   text: 'var(--error)',   border: 'var(--error)' },
    success: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)' },
    info:    { bg: 'var(--accent-light)', text: 'var(--accent-primary)', border: 'var(--accent-primary)' },
  };
  const c = colors[type] || colors.info;

  return (
    <div
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.25rem',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.9rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        pointerEvents: 'auto',
        textAlign: 'center',
        animation: 'dt-toast-in 0.2s ease',
        width: '100%',
      }}
      role="alert"
    >
      {message}
    </div>
  );
}

/* Inject keyframes once */
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes dt-toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  if (!document.head.querySelector('[data-dt-toast]')) {
    style.setAttribute('data-dt-toast', '1');
    document.head.appendChild(style);
  }
}
