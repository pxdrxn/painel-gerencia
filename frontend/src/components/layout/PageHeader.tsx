import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#1B365D] rounded-full"></div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 ml-4.5 pl-4.5">
            {subtitle}
          </p>
        )}
      </div>
      
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}
