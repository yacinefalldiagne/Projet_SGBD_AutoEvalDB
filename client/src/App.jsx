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

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />, // Le Navbar doit être à l'intérieur de Layout
      children: [
        { index: true, element: <Home /> },
        { path: "home", element: <Home /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "dashboard", element: <DashboardPage /> },
        { path: "Sujets", element: <StudentAssignmentsPage /> },
        { path: "Soumettre reponse", element: <StudentSubmitResponsePage /> },
        { path: "Consulter correction", element: <StudentViewCorrectionsPage /> },
        { path: "analytics", element: <h1 className="title">Analytics</h1> },
        { path: "reports", element: <h1 className="title">Reports</h1> },
        { path: "Deconnexion", element: <h1 className="title">Deconnexion</h1> },
        { path: "products", element: <h1 className="title">Products</h1> },
        { path: "new-product", element: <h1 className="title">New Product</h1> },
        { path: "inventory", element: <h1 className="title">Inventory</h1> },
        { path: "settings", element: <h1 className="title">Settings</h1> },
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
