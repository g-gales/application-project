import { useAuth } from "./hooks/useAuth";

import AppRoutes from "./routes/AppRoutes";

function App() {
  const { user } = useAuth();

  return <AppRoutes user={user} />;
}

export default App;
