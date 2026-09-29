import React, { useState, useCallback, useEffect } from 'react';
import '../styles/toast.css';
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
      className="toast-container"
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
      className="toast-item"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
      role="alert"
    >
      {message}
    </div>
  );
}
