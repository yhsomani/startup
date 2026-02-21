import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showValue = false,
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          star: 'w-4 h-4',
          container: 'gap-1'
        };
      case 'large':
        return {
          star: 'w-8 h-8',
          container: 'gap-2'
        };
      default:
        return {
          star: 'w-6 h-6',
          container: 'gap-1.5'
        };
    }
  };

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const isFilled = starValue <= (isHovering ? hoveredRating : rating);

    const sizeClasses = getSizeClasses();

    return (
      <div
        key={starIndex}
        className={`${sizeClasses.container} ${className}`}

        onMouseEnter={() => {
          if (!readonly) {
            setHoveredRating(starValue);
            setIsHovering(true);
          }
        }}
        onMouseLeave={() => {
          if (!readonly) {
            setHoveredRating(0);
            setIsHovering(false);
          }
        }}
        onClick={() => {
          if (!readonly && onRatingChange) {
            onRatingChange(starValue);
          }
        }}
        style={{ display: 'inline-flex', alignItems: 'center', cursor: readonly ? 'default' : 'pointer' }}
      >
        <svg
          className={`${sizeClasses.star} transition-colors duration-200`}
          style={{
            color: isFilled ? '#fbbf24' : isHovering && starValue <= hoveredRating ? '#fcd34d' : '#e5e7eb'
          }}
          fill={isFilled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2l3.09 6.26L22 9l-1.91 5.91-7.42 1.41-1.41L12 14.18z" />
          {!isFilled && (
            <path d="M12 2l3.09 6.26L22 9l-1.91 5.91-7.42 1.41-1.41L12 14.18z" />
          )}
        </svg>

        {showValue && !readonly && (
          <span
            className="ml-2 text-sm text-gray-600"
            style={{ minWidth: '2rem' }}
          >
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`star-rating ${readonly ? 'readonly' : 'interactive'}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(renderStar)}

      {showValue && !readonly && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)} out of 5
        </span>
      )}

      {readonly && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)} {rating === 1 ? 'star' : 'stars'}
        </span>
      )}

      <style jsx>{`
        .star-rating {
          display: inline-flex;
          align-items: center;
        }

        .star-rating.readonly svg {
          cursor: default !important;
        }

        .star-rating.interactive svg:hover {
          transform: scale(1.1);
          transform-origin: center;
        }

        .star-rating svg {
          transition: all 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default StarRating;