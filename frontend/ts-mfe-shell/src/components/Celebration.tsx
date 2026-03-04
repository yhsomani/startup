import React, { useEffect, useState } from 'react';

interface CelebrationProps {
  show: boolean;
  type: 'success' | 'achievement' | 'level-up' | 'first-action';
  message?: string;
  onComplete?: () => void;
}

const CELEBRATION_CONFIG = {
  success: {
    emoji: '🎉',
    title: 'Success!',
    bgColor: '#d1fae5',
    borderColor: '#10b981',
    emojiAnimation: 'celebrate 0.6s ease-out'
  },
  achievement: {
    emoji: '🏆',
    title: 'Achievement Unlocked!',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    emojiAnimation: 'trophy 0.8s ease-out'
  },
  'level-up': {
    emoji: '⬆️',
    title: 'Level Up!',
    bgColor: '#e0e7ff',
    borderColor: '#4f46e5',
    emojiAnimation: 'levelUp 0.7s ease-out'
  },
  'first-action': {
    emoji: '🌟',
    title: 'First Step!',
    bgColor: '#fce7f3',
    borderColor: '#ec4899',
    emojiAnimation: 'starBurst 0.8s ease-out'
  }
};

const MESSAGES = {
  success: [
    "You made it happen!",
    "Another win in the bag!",
    "Keep that momentum going!",
    "You're on fire! 🔥"
  ],
  achievement: [
    "Badge earned!",
    "Milestone reached!",
    "You're crushing it!",
    "Legendary work!"
  ],
  'level-up': [
    "You've grown stronger!",
    "New heights await!",
    "Level up, superstar!",
    "Ready for more challenges!"
  ],
  'first-action': [
    "Every journey starts with one step!",
    "You've begun something great!",
    "The adventure starts now!",
    "Welcome to TalentSphere!"
  ]
};

export const Celebration: React.FC<CelebrationProps> = ({ 
  show, 
  type, 
  message,
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  
  const config = CELEBRATION_CONFIG[type];
  const defaultMessage = message || MESSAGES[type][Math.floor(Math.random() * MESSAGES[type].length)];

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generate confetti particles
      const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setParticles(newParticles);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isVisible) return null;

  return (
    <div style={styles.overlay}>
      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            ...styles.particle,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `particleFly 1s ease-out forwards`
          }}
        />
      ))}

      <div style={{
        ...styles.card,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}>
        <div style={{
          ...styles.emojiWrapper,
          animation: config.emojiAnimation
        }}>
          <span style={styles.emoji}>{config.emoji}</span>
        </div>
        
        <h3 style={{
          ...styles.title,
          color: config.borderColor
        }}>
          {config.title}
        </h3>
        
        <p style={styles.message}>{defaultMessage}</p>
        
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            ...styles.dismissButton,
            backgroundColor: config.borderColor
          }}
        >
          Awesome!
        </button>
      </div>

      <style>{`
        @keyframes celebrate {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes trophy {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes levelUp {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          75% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes starBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        @keyframes particleFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease-out'
  },
  card: {
    padding: '2rem',
    borderRadius: '16px',
    border: '3px solid',
    textAlign: 'center',
    maxWidth: '320px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  emojiWrapper: {
    fontSize: '56px',
    marginBottom: '0.5rem'
  },
  emoji: {
    display: 'block'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.5rem 0'
  },
  message: {
    fontSize: '1rem',
    color: '#374151',
    margin: '0 0 1.5rem 0'
  },
  dismissButton: {
    padding: '0.75rem 2rem',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  particle: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  }
};

export default Celebration;
