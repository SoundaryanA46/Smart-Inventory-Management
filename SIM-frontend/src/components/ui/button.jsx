import React from 'react';

export function Button({ children, className = '', type = 'button', onClick, disabled, variant = 'default', size = 'default', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm hover:shadow-md',
    outline: 'border border-border bg-surface hover:bg-muted hover:text-foreground',
    ghost: 'hover:bg-muted hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-lg px-3 text-xs',
    lg: 'h-11 rounded-xl px-8',
    icon: 'h-10 w-10',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
