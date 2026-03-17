import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 rounded-md",
        className
      )} 
    />
  );
};
