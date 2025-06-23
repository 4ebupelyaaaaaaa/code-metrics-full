import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/main-layout/index";
import Home from "@/pages/home/home";
import NotFound from "@/pages/NotFound";
import AuthPage from "./pages/auth/auth-page";
import RegisterPage from "./pages/auth/register-page";
import ResultsPage from "@/pages/results/analysis-results-page";
import { PrivateRoute } from "./shared/router/private-router";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "*", element: <NotFound /> },
      {
        path: "results",
        element: (
          <PrivateRoute>
            <ResultsPage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);
