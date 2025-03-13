import React from "react";

export function Label({ htmlFor, children, ...props }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700" {...props}>
      {children}
    </label>
  );
}