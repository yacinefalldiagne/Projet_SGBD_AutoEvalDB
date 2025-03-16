import React from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Contenu */}
                <div className="mb-4">{children}</div>

                {/* Bouton de fermeture */}
                <div className="text-right">
                    <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;