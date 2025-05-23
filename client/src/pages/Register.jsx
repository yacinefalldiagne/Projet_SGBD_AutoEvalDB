import { Link, useNavigate } from "react-router-dom";
import pattern from "../assets/images/pattern.jpg";
import github from "../assets/images/github.svg";
import { ArrowLeft } from 'lucide-react';
import { useState } from "react";

import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Register() {

    const navigate = useNavigate();

    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'etudiant'
    });

    const registerUser = async (e) => {
        e.preventDefault();
        const { name, email, password, role } = data;

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`,
                { name, email, password, role },
                { withCredentials: true }
            );

            if (response.data.error) {
                toast.error(response.data.error);
            } else {
                setData({ name: '', email: '', password: '', role: 'etudiant' });

                // Redirection en fonction du rôle
                if (response.data.user?.role === "enseignant") {
                    navigate('/enseignant');
                } else {
                    navigate('/etudiant'); // Par défaut, rediriger les autres utilisateurs ici
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription :", error);
            toast.error("Une erreur s'est produite. Veuillez réessayer.");
        }
    };


    return (
        <section className="m-8 flex">
            <div className="w-3/5 h-full hidden lg:block relative">
                <img
                    src={pattern}
                    className="h-full w-full object-cover rounded-3xl"
                    alt="Pattern"
                />
                <Link to="/" className="absolute top-4 left-4 text-2xl text-white">
                    <ArrowLeft />
                </Link>
            </div>

            <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">

                <div className="text-center">
                    <h2 className="font-bold mb-4 text-2xl">Rejoignez-nous aujourd'hui</h2>
                    <p className="text-lg font-normal text-blue-gray-500">Saisir votre email et mot de passe pour vous inscrire.</p>
                </div>
                <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={registerUser}>
                    <div className="mb-1 flex flex-col gap-6">
                        <label className="font-medium text-blue-gray-500 -mb-3">
                            Votre nom et prénom
                        </label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="border border-gray-500 focus:border-t-gray-900 p-2 rounded-lg"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                        />
                        <label className="font-medium text-blue-gray-500 -mb-3">
                            Votre email
                        </label>
                        <input
                            type="email"
                            placeholder="name@mail.com"
                            className="border border-gray-500 focus:border-t-gray-900 p-2 rounded-lg"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                        />
                        <label className="font-medium text-blue-gray-500 -mb-3">
                            Votre mot de passe
                        </label>
                        <input
                            type="password"
                            placeholder="********"
                            className="border border-gray-500 focus:border-t-gray-900 p-2 rounded-lg"
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-6">
                        <div className="flex items-center">

                            <label htmlFor="terms" className="flex items-center font-medium text-gray-700">
                                <input type="checkbox" id="terms" className="w-6 h-6 -ml-2.5" />
                                J'accepte&nbsp;
                                <a
                                    href="#"
                                    className="font-normal text-black transition-colors hover:text-gray-900 underline"
                                >
                                    Les conditions d'utilisation
                                </a>
                            </label>
                        </div>
                    </div>
                    <button className="mt-6 w-full bg-sky-800 text-white p-2 rounded-lg" type="submit" >
                        S'inscrire
                    </button>

                    <div className="space-y-4 mt-8">
                        <button className="flex items-center gap-2 justify-center shadow-md w-full bg-white p-2 rounded-lg">
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_1156_824)">
                                    <path d="M16.3442 8.18429C16.3442 7.64047 16.3001 7.09371 16.206 6.55872H8.66016V9.63937H12.9813C12.802 10.6329 12.2258 11.5119 11.3822 12.0704V14.0693H13.9602C15.4741 12.6759 16.3442 10.6182 16.3442 8.18429Z" fill="#4285F4" />
                                    <path d="M8.65974 16.0006C10.8174 16.0006 12.637 15.2922 13.9627 14.0693L11.3847 12.0704C10.6675 12.5584 9.7415 12.8347 8.66268 12.8347C6.5756 12.8347 4.80598 11.4266 4.17104 9.53357H1.51074V11.5942C2.86882 14.2956 5.63494 16.0006 8.65974 16.0006Z" fill="#34A853" />
                                    <path d="M4.16852 9.53356C3.83341 8.53999 3.83341 7.46411 4.16852 6.47054V4.40991H1.51116C0.376489 6.67043 0.376489 9.33367 1.51116 11.5942L4.16852 9.53356Z" fill="#FBBC04" />
                                    <path d="M8.65974 3.16644C9.80029 3.1488 10.9026 3.57798 11.7286 4.36578L14.0127 2.08174C12.5664 0.72367 10.6469 -0.0229773 8.65974 0.000539111C5.63494 0.000539111 2.86882 1.70548 1.51074 4.40987L4.1681 6.4705C4.8001 4.57449 6.57266 3.16644 8.65974 3.16644Z" fill="#EA4335" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_1156_824">
                                        <rect width="16" height="16" fill="white" transform="translate(0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                            <span>S"inscrire avec Google</span>
                        </button>
                        <button className="flex items-center gap-2 justify-center shadow-md w-full bg-white p-2 rounded-lg">
                            <img src={github} height={24} width={24} alt="GitHub Logo" />
                            <span>S"inscrire avec GitHub</span>
                        </button>
                    </div>
                    <p className="text-center text-blue-gray-500 font-medium mt-4">
                        Déjà inscrit?
                        <Link to="/login" className="text-blue-900 ml-1">Se connecter</Link>
                    </p>
                </form>
            </div>
        </section>
    );
}