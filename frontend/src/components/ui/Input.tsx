import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "block w-full rounded-md border shadow-sm sm:text-sm px-3 py-2 focus:outline-none transition-colors",
              error 
                ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                : "border-gray-300 text-gray-900 focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D]",
              className
            )}
            {...props}
          />
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
Input.displayName = "Input";

export default Input;
