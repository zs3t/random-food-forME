"use client"

import React, { useCallback, createContext, useContext, ReactNode } from "react"
import { Toaster, toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "success" | "destructive"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
    switch (variant) {
      case "success":
        sonnerToast.success(title, { description });
        break;
      case "destructive":
        sonnerToast.error(title, { description });
        break;
      default:
        sonnerToast(title, { description });
        break;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster richColors />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
