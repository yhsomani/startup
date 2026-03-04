import React, { useState } from 'react';

const TOOLTIP_QUIPS = [
  "Psst! Here's a secret!",
  "You found it!",
  "Nice catch!",
  "Goldmine ahead!",
  "Shhh... secret info",
  "Click for magic!",
];

interface PlayfulTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showQuip?: boolean;
}

export const PlayfulTooltip: React.FC<PlayfulTooltipProps> = ({
  children,
  content,
  position = 'top',
  showQuip = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [quip] = useState(() => 
    TOOLTIP_QUIPS[Math.floor(Math.random() * TOOLTIP_QUIPS.length)]
  );

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  return (
    <div 
      style={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div style={{ ...styles.tooltip, ...positionStyles[position] }}>
          {showQuip && <div style={styles.quip}>{quip}</div>}
          <div style={styles.content}>{content}</div>
          <div style={styles.arrow(position)} />
        </div>
      )}
    </div>
  );
};

const positionStyles: Record<string, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' }
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'fadeIn 0.2s ease-out'
  },
  quip: {
    fontSize: '10px',
    color: '#9ca3af',
    marginBottom: '4px',
    fontStyle: 'italic'
  },
  content: {
    fontWeight: 500
  },
  arrow: (position: string) => ({
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    ...(position === 'top' && { borderWidth: '6px 6px 0 6px', borderColor: '#1f2937 transparent transparent', left: '50%', transform: 'translateX(-50%)', bottom: '-6px' }),
    ...(position === 'bottom' && { borderWidth: '0 6px 6px 6px', borderColor: 'transparent transparent #1f2937', left: '50%', transform: 'translateX(-50%)', top: '-6px' }),
    ...(position === 'left' && { borderWidth: '6px 0 6px 6px', borderColor: 'transparent transparent transparent #1f2937', right: '-6px', top: '50%', transform: 'translateY(-50%)' }),
    ...(position === 'right' && { borderWidth: '6px 6px 6px 0', borderColor: 'transparent #1f2937 transparent transparent', left: '-6px', top: '50%', transform: 'translateY(-50%)' })
  })
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}

export default PlayfulTooltip;
