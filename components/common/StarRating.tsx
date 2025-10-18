import React from 'react';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const Star: React.FC<{ filled: boolean; onClick?: () => void; sizeClass: string }> = ({ filled, onClick, sizeClass }) => (
  <svg
    onClick={onClick}
    className={`
      ${sizeClass}
      ${filled ? 'text-yellow-400' : 'text-gray-300'}
      ${onClick ? 'cursor-pointer' : ''}
    `}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.175 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  const sizeClass = sizeClasses[size];

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= rating}
          onClick={setRating ? () => setRating(star) : undefined}
          sizeClass={sizeClass}
        />
      ))}
    </div>
  );
};

export default StarRating;
