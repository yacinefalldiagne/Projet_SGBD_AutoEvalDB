import { Menu, X } from 'lucide-react';
import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
    const LINKS = [
        {
            name: "Accueil",
            link: "/",
        },
        {
            name: "Manuel",
            link: "/manuel",
        },
        {
            name: "Connexion",
            link: "/login",
        },
    ];

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="relative z-20 bg-white shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-8">
                <div className="pl-2">
                    <Link to="/">
                        <div className="text-2xl font-bold text-black-500">Auto Eval</div>
                    </Link>
                </div>

                <div className="md:hidden">
                    <button onClick={toggleMenu} className="text-2xl pr-2 focus:outline-none"
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>

                <div className="hidden md:flex space-x-8 md:space-x-4 pr-2 items-center">
                    {LINKS.map((link, index) => (
                        <Link
                            key={index}
                            to={link.link}
                            className={`uppercase text-sm font-medium ${link.name === "Connexion" ? "bg-gradient-to-r from-sky-500 to-sky-800 text-white py-3 px-4 rounded-md" : "hover:text-sky-800"}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className={`${isOpen ? "block" : "hidden"} md:hidden absolute bg-neutral-50 w-full py-5 px-4 mt-2 border-b-4 space-y-4`}>
                {LINKS.map((link, index) => (
                    <Link
                        key={index}
                        to={link.link}
                        className={`uppercase text-lg font-medium block tracking-wide ${link.name === "Connexion" ? "bg-gradient-to-r from-sky-500 to-sky-800 text-white py-3 px-4 rounded-md text-center" : "hover:text-sky-800"}`}
                        onClick={toggleMenu}
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
        </nav>
    );
}

export default Navbar;