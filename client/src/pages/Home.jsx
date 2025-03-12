import { Link } from "react-router-dom";
import React from 'react';
import { GraduationCap, NotebookPen } from 'lucide-react';
import Navbar from "../components/Navbar";

function Home() {
    return (
        <>
            <section className="max-w-7xl mx-auto border-b-2 px-4">
                <Navbar />
                <div className="flex flex-col items-center mt-6 lg:mt-20">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide">
                        <span className="bg-gradient-to-r from-sky-500 to-sky-800 text-transparent bg-clip-text">
                            Enseignants & Etudiants
                        </span>
                    </h1>
                    <p className="mt-10 text-lg text-center text-neutral-500 max-w-4xl">
                        Transformez l'évaluation des bases de données avec notre plateforme intelligente.
                        Simplifiez la correction et améliorez l'apprentissage grâce à des outils d'évaluation automatisés.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center my-20 space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <NotebookPen className="text-4xl text-sky-500 mb-4 mx-auto" />
                            <h2 className="text-xl font-semibold mb-2">Vous êtes enseignant ?</h2>
                            <p className="text-neutral-500 mb-4">Espace enseignant</p>
                            <Link to="/login" className="bg-gradient-to-r from-sky-500 to-sky-800 py-3 px-4 rounded-md text-white text-center">Se connecter</Link>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                            <GraduationCap className="text-4xl text-sky-500 mb-4 mx-auto" />
                            <h2 className="text-xl font-semibold mb-2">Vous êtes étudiant ?</h2>
                            <p className="text-neutral-500 mb-4">Espace étudiant</p>
                            <Link to="/login" className="bg-gradient-to-r from-sky-500 to-sky-800 py-3 px-4 rounded-md text-white text-center">Se connecter</Link>
                        </div>
                    </div>
                </div>
            </section>
            <footer className="bg-gray-100 py-4 text-center">
                <p className="text-sm text-gray-500">&copy; 2025 Auto Eval. Tous droits réservés.</p>
            </footer>
        </>
    );
}

export default Home;