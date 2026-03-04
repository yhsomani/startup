import React from 'react';

interface EmptyStateProps {
  type: 'jobs' | 'courses' | 'applications' | 'connections' | 'notifications' | 'search' | 'messages';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EMPTY_STATE_CONTENT: Record<string, { emoji: string; title: string; description: string; tip?: string }> = {
  jobs: {
    emoji: '💼',
    title: 'No jobs yet',
    description: "You haven't posted any jobs. Time to find some amazing talent!",
    tip: "Great job postings attract great candidates."
  },
  courses: {
    emoji: '📚',
    title: 'Time to learn something new!',
    description: "You haven't enrolled in any courses yet. Your brain is about to get smarter!",
    tip: "Even 15 minutes a day makes a difference."
  },
  applications: {
    emoji: '📝',
    title: 'No applications yet',
    description: "Your job applications will appear here. Time to put yourself out there!",
    tip: "Quality applications beat quantity every time."
  },
  connections: {
    emoji: '🤝',
    title: 'Your network is waiting',
    description: "Start connecting with professionals in your industry!",
    tip: "A warm introduction works wonders."
  },
  notifications: {
    emoji: '🔔',
    title: 'All caught up!',
    description: "You're notifications-free! We promise that's a good thing.",
    tip: "Check back later for updates."
  },
  search: {
    emoji: '🔍',
    title: 'Nothing found',
    description: "We couldn't find anything matching your search. Try different keywords!",
    tip: "Sometimes a simpler search finds more."
  },
  messages: {
    emoji: '💬',
    title: 'Start a conversation',
    description: "No messages yet. Be the first to say hello!",
    tip: "People love hearing from interesting folks."
  }
};

export const PlayfulEmptyState: React.FC<EmptyStateProps> = ({ type, action }) => {
  const content = EMPTY_STATE_CONTENT[type];

  return (
    <div style={styles.container}>
      <div style={styles.emojiContainer}>
        <span style={styles.emoji}>{content.emoji}</span>
      </div>
      
      <h3 style={styles.title}>{content.title}</h3>
      <p style={styles.description}>{content.description}</p>
      
      {content.tip && (
        <div style={styles.tipContainer}>
          <span style={styles.tipIcon}>💡</span>
          <span style={styles.tip}>{content.tip}</span>
        </div>
      )}
      
      {action && (
        <button 
          onClick={action.onClick}
          style={styles.actionButton}
        >
          {action.label}
        </button>
      )}
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
    gap: '1rem'
  },
  emojiContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e0e7ff, #f3e8ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  emoji: {
    fontSize: '36px',
    animation: 'float 3s ease-in-out infinite'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0
  },
  description: {
    fontSize: '0.95rem',
    color: '#6b7280',
    maxWidth: '320px',
    lineHeight: 1.5,
    margin: 0
  },
  tipContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    marginTop: '0.5rem'
  },
  tipIcon: {
    fontSize: '16px'
  },
  tip: {
    fontSize: '0.85rem',
    color: '#92400e',
    fontStyle: 'italic'
  },
  actionButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default PlayfulEmptyState;
