import React, { useState, useEffect } from 'react';

const TOAST_ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  confetti: '🎉'
};

const TOAST_MESSAGES: Record<string, string[]> = {
  success: ['Boom! Done!', 'Nailed it!', 'Success smells sweet!', 'You made it happen!'],
  error: ['Oopsie daisy!', 'Not today, Satan!', 'Womp womp...', 'Well, that happened.'],
  warning: ['Heads up!', 'Careful now!', 'Proceed with caution!', 'Hold your horses!'],
  info: ['Just so you know...', 'FYI!', 'Hot off the press!', 'Knowledge drop!'],
  confetti: ['Party time!', 'Let\'s celebrate!', 'You rock!', 'Time to dance!']
};

interface PlayfulToastProps {
  type?: 'success' | 'error' | 'warning' | 'info' | 'confetti';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const PlayfulToast: React.FC<PlayfulToastProps> = ({
  type = 'info',
  message,
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const randomMessage = TOAST_MESSAGES[type]?.[Math.floor(Math.random() * TOAST_MESSAGES[type].length)] || '';
  const icon = TOAST_ICONS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      ...styles.container,
      ...styles[type],
      opacity: isLeaving ? 0 : 1,
      transform: isLeaving ? 'translateX(100%)' : 'translateX(0)'
    }}>
      <div style={styles.iconContainer}>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div style={styles.content}>
        {randomMessage && <div style={styles.quip}>{randomMessage}</div>}
        <div style={styles.message}>{message}</div>
      </div>
      <button 
        style={styles.closeButton}
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => {
            setIsVisible(false);
            onClose?.();
          }, 300);
        }}
      >
        ✕
      </button>
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progress,
            ...styles[`${type}Progress` as keyof typeof styles] as React.CSSProperties,
            animationDuration: `${duration}ms`
          }} 
        />
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confetti';
    message: string;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
  <div style={styles.containerWrapper}>
    {toasts.map((toast) => (
      <PlayfulToast
        key={toast.id}
        type={toast.type}
        message={toast.message}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  containerWrapper: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 9999,
    maxWidth: '360px'
  },
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  iconContainer: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  icon: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  quip: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '2px'
  },
  message: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.4
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    lineHeight: 1,
    transition: 'color 0.2s'
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: '#f3f4f6'
  },
  progress: {
    height: '100%',
    borderRadius: '0 2px 2px 0',
    animation: 'shrink linear forwards'
  },
  success: { borderLeft: '4px solid #10b981' },
  successProgress: { backgroundColor: '#10b981' },
  error: { borderLeft: '4px solid #ef4444' },
  errorProgress: { backgroundColor: '#ef4444' },
  warning: { borderLeft: '4px solid #f59e0b' },
  warningProgress: { backgroundColor: '#f59e0b' },
  info: { borderLeft: '4px solid #3b82f6' },
  infoProgress: { backgroundColor: '#3b82f6' },
  confetti: { borderLeft: '4px solid #8b5cf6' },
  confettiProgress: { backgroundColor: '#8b5cf6' }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default PlayfulToast;
