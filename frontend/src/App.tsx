import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { ChatPage } from "./pages/ChatPage";
import { api } from "./services/api";

export default function App() {
  const [authenticated, setAuthenticated] = useState(api.isAuthenticated());

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return <ChatPage onLogout={() => setAuthenticated(false)} />;
}
