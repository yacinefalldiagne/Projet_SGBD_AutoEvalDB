import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@/contexts/theme-context";

import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import StudentAssignmentsPage from "@/routes/Sujets/page"; // À ajuster selon votre structure
import StudentSubmitResponsePage from "@/routes/Reponse/page"; // Ajustez le chemin
import StudentViewCorrectionsPage from "@/routes/Correction/page"; // Ajustez le chemin

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <DashboardPage />,
                },
                {
                    path: "analytics",
                    element: <h1 className="title">Analytics</h1>,
                },
                {
                    path: "reports",
                    element: <h1 className="title">Reports</h1>,
                },
                {
                    path: "Sujets",
                    element: <StudentAssignmentsPage />,
                },
                {
                    path: "Soumettre reponse",
                    element: <StudentSubmitResponsePage />,                
                },
                {
                    path: "Consulter correction",
                    element: <StudentViewCorrectionsPage />,                
                },
                {
                    path: "Deconnexion",
                    element: <h1 className="title">Deconnexion</h1>,
                },
                {
                    path: "products",
                    element: <h1 className="title">Products</h1>,
                },
                {
                    path: "new-product",
                    element: <h1 className="title">New Product</h1>,
                },
                {
                    path: "inventory",
                    element: <h1 className="title">Inventory</h1>,
                },
                {
                    path: "settings",
                    element: <h1 className="title">Settings</h1>,
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;
