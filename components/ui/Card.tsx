import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  color?: 'default' | 'primary' | 'secondary' | 'accent';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, color = 'default' }) => {
  let headerColor = '';
  let borderColor = 'border-slate-200';

  switch(color) {
    case 'primary': 
      headerColor = 'bg-primary text-white'; 
      borderColor = 'border-primary/20';
      break;
    case 'secondary': 
      headerColor = 'bg-secondary text-white'; 
      borderColor = 'border-secondary/20';
      break;
    case 'accent': 
      headerColor = 'bg-accent text-white'; 
      borderColor = 'border-accent/20';
      break;
    default: 
      headerColor = 'bg-slate-50 text-slate-700 border-b border-slate-200';
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${borderColor} overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className={`px-4 py-3 font-semibold ${headerColor}`}>
          {title}
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};