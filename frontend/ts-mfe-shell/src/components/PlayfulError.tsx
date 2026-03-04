import React from 'react';

interface PlayfulErrorProps {
  error?: string;
  code?: string;
  onRetry?: () => void;
}

const ERROR_CONTENT: Record<string, { emoji: string; title: string; description: string; tip: string }> = {
  network: {
    emoji: '📡',
    title: 'Oops! Signal lost!',
    description: "We couldn't reach the server. Your internet might be taking a coffee break.",
    tip: "Check your connection, then try again!"
  },
  notFound: {
    emoji: '🔍',
    title: '404: Treasure not found',
    description: "The page you're looking for went on an adventure and got lost.",
    tip: "Maybe it's hiding somewhere else?"
  },
  server: {
    emoji: '😵‍💫',
    title: "Something went sideways",
    description: "Our servers are having a moment. It's not you, it's us... probably.",
    tip: "Give it a minute, we're probably fixing it!"
  },
  unauthorized: {
    emoji: '🚫',
    title: 'Access denied!',
    description: "This area is for authorized personnel only. No sneak peeking!",
    tip: "Log in to unlock the good stuff."
  },
  validation: {
    emoji: '📝',
    title: 'Hold on!',
    description: "Something in the form doesn't look quite right.",
    tip: "Check the highlighted fields and try again."
  },
  rateLimit: {
    emoji: '⏳',
    title: 'Whoa, slow down!',
    description: "You're being too fast for us! We need to catch our breath.",
    tip: "Take a quick break and try again in a moment."
  },
  default: {
    emoji: '🤔',
    title: 'Hmm, something happened',
    description: "We're not sure what went wrong, but we're looking into it!",
    tip: "Try refreshing the page?"
  }
};

export const PlayfulError: React.FC<PlayfulErrorProps> = ({ 
  error, 
  code,
  onRetry 
}) => {
  const content = code ? (ERROR_CONTENT[code] || ERROR_CONTENT.default) : ERROR_CONTENT.default;

  return (
    <div style={styles.container}>
      <div style={styles.emojiContainer}>
        <span style={styles.emoji}>{content.emoji}</span>
      </div>
      
      <h3 style={styles.title}>{content.title}</h3>
      <p style={styles.description}>
        {error || content.description}
      </p>
      
      <div style={styles.tipContainer}>
        <span style={styles.tipIcon}>💡</span>
        <span style={styles.tip}>{content.tip}</span>
      </div>
      
      {onRetry && (
        <div style={styles.actionContainer}>
          <button 
            onClick={onRetry}
            style={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      <div style={styles.homeLink}>
        <a href="/" style={styles.link}>
          ← Back to safety
        </a>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
    gap: '1rem',
    minHeight: '400px'
  },
  emojiContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fee2e2, #fef3c7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  emoji: {
    fontSize: '48px',
    animation: 'shake 0.5s ease-in-out'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#111827',
    margin: 0
  },
  description: {
    fontSize: '1rem',
    color: '#6b7280',
    maxWidth: '400px',
    lineHeight: 1.6,
    margin: 0
  },
  tipContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginTop: '0.5rem'
  },
  tipIcon: {
    fontSize: '16px'
  },
  tip: {
    fontSize: '0.9rem',
    color: '#4b5563'
  },
  actionContainer: {
    marginTop: '1rem'
  },
  retryButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  homeLink: {
    marginTop: '1.5rem'
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontSize: '0.9rem'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default PlayfulError;
