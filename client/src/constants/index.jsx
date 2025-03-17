import { CloudCog, BookOpen, ChartColumn, NotepadText, Edit, Home, Settings, SpellCheck, FileText, Send, LogOut, Package } from "lucide-react";


import ProfileImage from "@/assets/profile-image.jpg";
import ProductImage from "@/assets/product-image.jpg";

export const navbarLinksEtudiant = [
    {
        title: "Dashboard",
        links: [{ label: "Dashboard", icon: Home, path: "/etudiant" }],
    },
    {
        title: "Sujets",
        links: [
            { label: "Sujets", icon: FileText, path: "/etudiant/sujets" },
            { label: "Soumettre réponse", icon: Send, path: "/etudiant/soumettre" },
            { label: "Consulter correction", icon: SpellCheck, path: "/etudiant/correction" },
        ],
    },
    {
        title: "Settings",
        links: [
            { label: "Paramètres", icon: Settings, path: "/etudiant/settings" },
        ],
    },
];

export const navbarLinksProf = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Statistiques",
                icon: ChartColumn,
                path: "/enseignant/statistique",
            },
            {
                label: "Dépôt de sujet",
                icon: NotepadText,
                path: "/enseignant/exercices",
            },
            {
                label: "Liste des devoirs",
                icon: Package,
                path: "/enseignant/devoirs",
            },
            {
                label: "Modèle de correction",
                icon: Edit,
                path: "/enseignant/correction",
            },
            {
                label: "Gestion des notes",
                icon: CloudCog,
                path: "/enseignant/ajustements",
            },
        ],
    },
    {
        title: "Intelligent",
        links: [
            {
                label: "Apprentissage",
                icon: BookOpen,
                path: "/enseignant/intelligent/apprentissage",
            },
        ],
    },
    {
        title: "Paramètres",
        links: [
            {
                label: "Paramètres",
                icon: Settings,
                path: "/enseignant/settings",
            },
            { label: "Déconnexion", icon: LogOut, path: "/logout" },
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