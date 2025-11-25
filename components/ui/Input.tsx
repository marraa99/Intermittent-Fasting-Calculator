import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  subLabel?: string;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({ label, subLabel, suffix, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-sm font-medium text-slate-700 mb-1">
        {label}
        {subLabel && <span className="text-xs text-slate-400 font-normal ml-1">({subLabel})</span>}
      </label>
      <div className="relative">
        <input
          className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-slate-400 text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};