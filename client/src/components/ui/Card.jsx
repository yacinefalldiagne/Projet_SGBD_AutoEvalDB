import React from "react";

const Card = ({ children, className }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${className}`}>
            {children}
        </div>
    );
};

export default Card;

export const CardContent = ({ children, className }) => {
    return <div className={`p-4 ${className}`}>{children}</div>;
};


