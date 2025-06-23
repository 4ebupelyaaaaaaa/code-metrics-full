import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./pages/auth/auth-provider";

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
