import { useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import ChatMain from "./components/ChatMain";
import PinPanel from "./components/PinPanel";
import { createRoom, isAuthenticated, login, register } from "./api";
import "./App.css";

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [roomListVersion, setRoomListVersion] = useState(0);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [pinPanelOpen, setPinPanelOpen] = useState(true);

  async function handleStartChat() {
    try {
      const newRoom = await createRoom();
      setActiveRoomId(newRoom.id);
      setRoomListVersion((version) => version + 1);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "チャットを開始できませんでした");
    }
  }

  async function handleLogin(name: string, password: string) {
    await login(name, password);
    setUserName(name);
    setAuthenticated(true);
  }

  async function handleRegister(name: string, password: string) {
    await register(name, password);
    await login(name, password);
    setUserName(name);
    setAuthenticated(true);
  }

  if (!authenticated) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className={`app ${pinPanelOpen ? "pin-open" : "pin-closed"}`}>
      <Topbar />
      <Sidebar
        key={roomListVersion}
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        userName={userName}
      />
      <ChatMain
        roomId={activeRoomId}
        onStartChat={handleStartChat}
        pinPanelOpen={pinPanelOpen}
        onTogglePin={() => setPinPanelOpen((o) => !o)}
      />
      {pinPanelOpen && <PinPanel roomId={activeRoomId} onClose={() => setPinPanelOpen(false)} />}
      {error && <div className="app-error">{error}</div>}
    </div>
  );
}

type AuthScreenProps = {
  onLogin: (name: string, password: string) => Promise<void>;
  onRegister: (name: string, password: string) => Promise<void>;
};

function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await onLogin(name, password);
      } else {
        await onRegister(name, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <i className="ti ti-messages" />
          <span>TaskChat</span>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            ログイン
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            登録
          </button>
        </div>

        <label className="auth-field">
          <span>ユーザー名</span>
          <input
            autoComplete="username"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="auth-field">
          <span>パスワード</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" disabled={submitting} type="submit">
          {submitting ? "送信中..." : mode === "login" ? "ログイン" : "登録して開始"}
        </button>
      </form>
    </main>
  );
}