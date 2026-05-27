import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function Modal({ children, isOpen, onClose, title }: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-2xl outline-none focus:outline-none">
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t-xl">
            <h3 className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
            <button
              className="p-1 ml-auto text-gray-400 bg-transparent border-0 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-900 transition-colors"
              onClick={onClose}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
