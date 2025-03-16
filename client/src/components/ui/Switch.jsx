// client/src/components/ui/Switch.jsx
import React from 'react';

const Switch = ({ checked, onCheckedChange }) => {
    return (
        <button
            type="button"
            onClick={() => {
                console.log("Switch clicked, new value:", !checked); // Débogage
                onCheckedChange(!checked);
            }}
            className={`w-10 h-5 rounded-full flex items-center p-1 transition-all duration-200 ${
                checked ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
            }`}
        >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200" />
        </button>
    );
};

export default Switch;