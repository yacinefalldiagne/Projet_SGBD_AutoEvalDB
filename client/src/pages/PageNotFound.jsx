import React from 'react';
import { Link } from 'react-router-dom';
import notFound from '../assets/images/3828559.png';
const PageNotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">Sorry, the page you are looking for does not exist.</p>
            <img src={notFound} alt="Page Not Found" className="w-1/6 mb-8" />
            <Link to="#" onClick={() => window.history.back()} className="text-blue-500 hover:text-blue-700">Go Back</Link>
        </div>
    );
};

export default PageNotFound;