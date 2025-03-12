import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import SettingsPage from "@/routes/settings/SettingsPage";
import CorrectionAuto from "./routes/intelligent/CorrectionAuto";
import ApprentissageAuto from "./routes/intelligent/Learn"; 
import IntelligentLayout from "./routes/intelligent/layout";
import DepotSujet from "./routes/dashboard/DepotSujet";
import GestionModelesCorrection from "./routes/dashboard/GestionModelesCorrection";
import Statistique from "./routes/dashboard/Statistique";


function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                { path: "Statistique", element: <Statistique /> },
                { path: "Exercices", element: <DepotSujet /> },
                { path: "Correction", element: < GestionModelesCorrection/> },
                { path: "settings", element: <SettingsPage /> },
                {
                    path: "Intelligent",
                    element: <IntelligentLayout />, 
                    children: [
                        { path: "CorrectionAutomatique", element: <CorrectionAuto /> },
                        { path: "Apprentissage", element: <ApprentissageAuto /> },
                    ],
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
