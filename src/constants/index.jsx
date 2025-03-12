import { ChartColumn, NotepadText,Edit,Package,PackagePlus,Settings,ShoppingBag, UserCheck, UserPlus,Users,Code,FileText,CloudCog,BookOpen } from "lucide-react";
//import ProfileImage from "@/assets/profile-image.jpg";
//import ProductImage from "@/assets/product-image.jpg";

export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Statistique",
                icon: ChartColumn,
                path: "/Statistique",
            },
            {
                label: "Dépôt de Sujet d’Examen",
                icon: NotepadText,
                path: "/Exercices",
            },
            {
                label: "Correction",
                icon: Edit,
                path: "/Correction",
            },
        ],
    },
    {
        title: "Intelligent",
        links: [
            {
                label: "Correction automatique",
                icon: CloudCog,
                path: "/Intelligent/CorrectionAutomatique",  
            },
            {
                label: "Apprentissage automatique",
                icon: BookOpen,
                path: "/Intelligent/Apprentissage", 
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
