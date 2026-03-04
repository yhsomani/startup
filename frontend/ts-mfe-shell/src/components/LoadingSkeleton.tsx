import React from 'react';

const FUNNY_SKELETON_MESSAGES = [
  "Stretching those bones...",
  "Waking up the skeletons...",
  "Building blocks...",
  "Assembling pixels...",
];

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
  gap?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 3,
  gap = '12px'
}) => {
  const [message, setMessage] = React.useState(
    FUNNY_SKELETON_MESSAGES[Math.floor(Math.random() * FUNNY_SKELETON_MESSAGES.length)]
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(
        FUNNY_SKELETON_MESSAGES[Math.floor(Math.random() * FUNNY_SKELETON_MESSAGES.length)]
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.skeletonContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.skeleton,
              width,
              height,
              borderRadius,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      <span style={styles.message}>{message}</span>
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div style={styles.card}>
    <LoadingSkeleton height="120px" borderRadius="8px" count={1} />
    <div style={styles.cardContent}>
      <LoadingSkeleton width="70%" height="16px" count={1} />
      <LoadingSkeleton width="40%" height="12px" count={1} />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div style={styles.list}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} style={styles.listItem}>
        <div style={styles.avatar} />
        <div style={styles.listItemContent}>
          <LoadingSkeleton width="60%" height="14px" count={1} />
          <LoadingSkeleton width="40%" height="12px" count={1} />
        </div>
      </div>
    ))}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  skeleton: {
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite'
  },
  listItemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  message: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default LoadingSkeleton;
