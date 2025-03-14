import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { ThemeProvider } from "@/contexts/theme-context";

import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import StudentAssignmentsPage from "@/routes/Sujets/page";
import StudentSubmitResponsePage from "@/routes/Reponse/page";
import StudentViewCorrectionsPage from "@/routes/Correction/page";
import Logout from "./pages/Logout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { Toaster } from "react-hot-toast";
import { UserContextProvider } from "@/contexts/user-context";
import { ProtectedRoutes } from "@/contexts/protected-routes";
import PageNotFound from "./pages/PageNotFound";

import SettingsPage from "@/routes/settings/SettingsPage";
import CorrectionAuto from "@/routes/intelligent/CorrectionAuto";
import ApprentissageAuto from "@/routes/intelligent/Learn";
import IntelligentLayout from "@/routes/intelligent/Layout";
import DepotSujet from "@/routes/enseignant/DepotSujet";
import GestionModelesCorrection from "@/routes/enseignant/GestionModelesCorrection";
import Statistique from "@/routes/enseignant/Statistique";


function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "*",
      element: <PageNotFound />,
    },
    { path: "logout", element: <Logout /> },

    {
      path: "/enseignant",
      element: <ProtectedRoutes />,
      children: [
        {
          element: <Layout />,
          children: [
            { index: true, element: <Statistique /> },
            { path: "statistique", element: <Statistique /> },
            { path: "exercices", element: <DepotSujet /> },
            { path: "correction", element: < GestionModelesCorrection /> },
            { path: "settings", element: <SettingsPage /> },

            {
              path: "Intelligent",
              element: <IntelligentLayout />,
              children: [
                { path: "correctionAutomatique", element: <CorrectionAuto /> },
                { path: "apprentissage", element: <ApprentissageAuto /> },
              ],
            },
          ],
        },

      ],
    },
    {
      path: "/etudiant",
      element: <ProtectedRoutes />, // Vérifie l'authentification
      children: [
        {
          element: <Layout />, // Contient le header, sidebar, etc.
          children: [
            { index: true, element: <DashboardPage /> },
            { path: "sujets", element: <StudentAssignmentsPage /> },
            { path: "soumettre", element: <StudentSubmitResponsePage /> },
            { path: "correction", element: <StudentViewCorrectionsPage /> },
          ],
        },
      ],
    },

  ]);

  return (
    <UserContextProvider>
      <ThemeProvider storageKey="theme">
        <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
        <RouterProvider router={router} />
      </ThemeProvider>
    </UserContextProvider>
  );

}

export default App;
