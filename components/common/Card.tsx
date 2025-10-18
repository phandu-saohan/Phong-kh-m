
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-clinic-border shadow-sm ${className}`}>
      {title && (
        <div className="px-4 sm:px-6 py-4 border-b border-clinic-border">
          <h3 className="text-lg font-semibold text-clinic-text">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;