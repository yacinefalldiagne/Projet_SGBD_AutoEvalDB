import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from "@/routes/dashboard/page";
import StudentAssignmentsPage from "@/routes/Sujets/page";
import StudentSubmitResponsePage from "@/routes/Reponse/page";
import StudentViewCorrectionsPage from "@/routes/Correction/page";
import SettingsPage from "@/routes/Settings/page";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />, // Le Navbar doit être à l'intérieur de Layout
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "home", element: <Home /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "dashboard", element: <DashboardPage /> },
        { path: "Sujets", element: <StudentAssignmentsPage /> },
        { path: "Soumettre reponse", element: <StudentSubmitResponsePage /> },
        { path: "Consulter correction", element: <StudentViewCorrectionsPage /> },
        { path: "Settings", element: <SettingsPage /> },
        { path: "Deconnexion", element: <h1 className="title">Deconnexion</h1> },
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
