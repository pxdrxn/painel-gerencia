import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  helperText?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "block w-full rounded-md border shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none transition-colors appearance-none",
              error 
                ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                : "border-gray-300 text-gray-900 focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
