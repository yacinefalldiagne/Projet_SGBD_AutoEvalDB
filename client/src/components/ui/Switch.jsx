import React from 'react';

const Switch = ({ checked, onCheckedChange }) => {
    return (
        <button
            onClick={() => onCheckedChange(!checked)}
            className={`w-10 h-5 rounded-full flex items-center justify-${checked ? "end" : "start"} bg-gray-300 p-1 transition-all duration-200`}
        >
            <div className="w-4 h-4 rounded-full bg-white"></div>
        </button>
    );
};

export default Switch;
