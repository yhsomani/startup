import React from 'react';

const FUNNY_LOADING_MESSAGES = [
  "Consulting the oracle...",
  "Counting pixels...",
  "Feeding the hamsters...",
  "Untangling spaghetti code...",
  "Brewing coffee...",
  "Convincing the server to cooperate...",
  "Sharpening pencils...",
  "Reading the documentation...",
  "Making things pretty...",
  "Chasing away bugs...",
  "Loading awesomeness...",
  "Calibrating delight...",
  "Polishing pixels...",
  "Summoning the data...",
  "Waving at satellites...",
  "Reticulating splines...",
];

interface WhimsicalLoadingProps {
  message?: string;
  showProgress?: boolean;
  variant?: 'spinner' | 'dots' | 'bounce' | 'pulse';
}

export const WhimsicalLoading: React.FC<WhimsicalLoadingProps> = ({
  message,
  showProgress = false,
  variant = 'spinner'
}) => {
  const [funnyMessage, setFunnyMessage] = React.useState(() => 
    FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]
  );

  React.useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setFunnyMessage(
          FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);

  const displayMessage = message || funnyMessage;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {variant === 'spinner' && <Spinner />}
        {variant === 'dots' && <Dots />}
        {variant === 'bounce' && <BouncingDots />}
        {variant === 'pulse' && <PulsingOrb />}
      </div>
      
      <p style={styles.message}>{displayMessage}</p>
      
      {showProgress && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar} />
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <div style={styles.spinner}>
    <div style={styles.spinnerInner} />
  </div>
);

const Dots = () => (
  <div style={styles.dotsContainer}>
    {[0, 1, 2].map((i) => (
      <div 
        key={i} 
        style={{
          ...styles.dot,
          animationDelay: `${i * 0.15}s`
        }} 
      />
    ))}
  </div>
);

const BouncingDots = () => (
  <div style={styles.bouncingContainer}>
    {['●', '●', '●'].map((dot, i) => (
      <span 
        key={i} 
        style={{
          ...styles.bouncingDot,
          animationDelay: `${i * 0.1}s`
        }}
      >
        {dot}
      </span>
    ))}
  </div>
);

const PulsingOrb = () => (
  <div style={styles.orbContainer}>
    <div style={styles.orb} />
    <div style={{...styles.orb, ...styles.orbDelay}} />
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem'
  },
  wrapper: {
    position: 'relative',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerInner: {
    position: 'absolute',
    width: '30px',
    height: '30px',
    border: '3px solid transparent',
    borderTopColor: '#06b6d4',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite reverse'
  },
  dotsContainer: {
    display: 'flex',
    gap: '8px'
  },
  dot: {
    width: '12px',
    height: '12px',
    backgroundColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'bounce 1s ease-in-out infinite'
  },
  bouncingContainer: {
    display: 'flex',
    gap: '6px',
    fontSize: '24px'
  },
  bouncingDot: {
    animation: 'bounce 0.6s ease-in-out infinite',
    color: '#4f46e5'
  },
  orbContainer: {
    position: 'relative',
    width: '50px',
    height: '50px'
  },
  orb: {
    position: 'absolute',
    width: '30px',
    height: '30px',
    background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  orbDelay: {
    animationDelay: '0.75s',
    opacity: 0.5
  },
  message: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: '200px'
  },
  progressContainer: {
    width: '150px',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressBar: {
    width: '40%',
    height: '100%',
    background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
    borderRadius: '2px',
    animation: 'progress 2s ease-in-out infinite'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
  }
  @keyframes progress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(150%); }
    100% { transform: translateX(-100%); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default WhimsicalLoading;
