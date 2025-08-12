import React from 'react';

interface UnreadBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component to display unread message count
 * Shows a red badge with the number of unread messages
 */
const UnreadBadge: React.FC<UnreadBadgeProps> = ({ 
  count, 
  className = '', 
  size = 'sm' 
}) => {
  // Don't render if count is 0 or negative
  if (count <= 0) return null;

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[18px] h-[18px]',
    md: 'text-sm px-2 py-1 min-w-[22px] h-[22px]',
    lg: 'text-base px-2.5 py-1.5 min-w-[26px] h-[26px]'
  };

  // Format count display (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        bg-red-500 text-white font-semibold rounded-full
        ${sizeClasses[size]}
        shadow-sm border border-red-600
        animate-pulse
        ${className}
      `}
      title={`${count} unread message${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
};

export default UnreadBadge;