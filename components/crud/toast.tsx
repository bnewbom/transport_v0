'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

/**
 * Custom hook for toast notifications
 */
export function useAppToast() {
  const { toast } = useToast();

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      });
    },
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
      });
    },
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      });
    },
  };
}

export { Toaster };
