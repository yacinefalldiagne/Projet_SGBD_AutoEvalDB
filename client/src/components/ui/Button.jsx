// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button; 