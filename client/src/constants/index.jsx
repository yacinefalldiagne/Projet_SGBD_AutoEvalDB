import { Home, Settings,  SpellCheck,FileText, Send,LogOut } from "lucide-react";

import ProfileImage from "@/assets/profile-image.jpg";
import ProductImage from "@/assets/product-image.jpg";

export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "/",
            },
           
        ],
    },
    {
        title: "Sujets",
        links: [
            {
                label: "Sujets",
                icon: FileText,
                path: "/Sujets",
            },
            {
                label: "Soumettre reponse",
                icon: Send,
                path: "/Soumettre reponse",
            },
            {
                label: "Consulter correction",
                icon: SpellCheck,
                path: "/Consulter correction",
            },
            
        ],
    },
   
    {
        title: "Settings",
        links: [
            {
                label: "Settings",
                icon: Settings,
                path: "/settings",
            },
            
        ],
    },
    
];

export const overviewData = [
    {
        name: "Jan",
        total: 1500,
    },
    {
        name: "Feb",
        total: 2000,
    },
    {
        name: "Mar",
        total: 1000,
    },
    {
        name: "Apr",
        total: 5000,
    },
    {
        name: "May",
        total: 2000,
    },
    {
        name: "Jun",
        total: 5900,
    },
    {
        name: "Jul",
        total: 2000,
    },
    {
        name: "Aug",
        total: 5500,
    },
    {
        name: "Sep",
        total: 2000,
    },
    {
        name: "Oct",
        total: 4000,
    },
    {
        name: "Nov",
        total: 1500,
    },
    {
        name: "Dec",
        total: 2500,
    },
];

export const progressionData = [
    { date: "2025-01-01", grade: 12, classAverage: 14 },
    { date: "2025-01-15", grade: 15, classAverage: 13 },
    { date: "2025-02-01", grade: 18, classAverage: 15 },
    { date: "2025-02-15", grade: 16, classAverage: 14 },
    { date: "2025-03-01", grade: 19, classAverage: 16 },
];

export const submissionsData = [
    {
        id: 1,
        exerciseName: "Requêtes SQL de base",
        date: "2025-01-01",
        grade: 12,
        feedback: "Bonne tentative, mais attention aux jointures manquantes.",
    },
    {
        id: 2,
        exerciseName: "Normalisation",
        date: "2025-01-15",
        grade: 15,
        feedback: "Bien normalisé, mais quelques dépendances fonctionnelles oubliées.",
    },
    {
        id: 3,
        exerciseName: "Triggers SQL",
        date: "2025-02-01",
        grade: 18,
        feedback: "Excellent travail sur les triggers !",
    },
    {
        id: 4,
        exerciseName: "Optimisation",
        date: "2025-02-15",
        grade: 16,
        feedback: "Bonne optimisation, mais index manquants.",
    },
    {
        id: 5,
        exerciseName: "Vues complexes",
        date: "2025-03-01",
        grade: 19,
        feedback: "Parfait, très bien structuré.",
    },
];