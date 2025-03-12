import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { ThemeProvider } from "@/contexts/theme-context";

import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import StudentAssignmentsPage from "@/routes/Sujets/page";
import TeacherCreateTopicPage from "./pages/Test";
import StudentSubmitResponsePage from "@/routes/Reponse/page";
import StudentViewCorrectionsPage from "@/routes/Correction/page";
import Logout from "./pages/Logout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { Toaster } from "react-hot-toast";
import { UserContextProvider } from "@/contexts/user-context";

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
      path: "/dashboard",
      element: <Layout />,
      children: [
        {
          index: true,
          element: <DashboardPage />,
        },
        {
          path: "/dashboard/sujets",
          element: <StudentAssignmentsPage />,
        },
        {
          path: "/dashboard/soumettre",
          element: <StudentSubmitResponsePage />,
        },
        {
          path: "/dashboard/correction",
          element: <StudentViewCorrectionsPage />,
        },
        {
          path: "/dashboard/topic",
          element: <TeacherCreateTopicPage />,
        },
        {
          path: "/dashboard/logout",
          element: <Logout />,
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
