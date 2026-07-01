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
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("user_name") ?? ""
  );
  const [pinPanelOpen, setPinPanelOpen] = useState(true);
  // 名前入力モーダル
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // EmptyChat・やりますからの「チャット開始」→ モーダルを開く
  function handleStartChat() {
    setRoomNameInput("");
    setShowRoomModal(true);
  }

  // モーダルで名前確定 → ルーム作成
  async function handleCreateRoom() {
    const name = roomNameInput.trim() || "新しいチャット";
    setCreatingRoom(true);
    try {
      const newRoom = await createRoom(name);
      setActiveRoomId(newRoom.id);
      setRoomListVersion((v) => v + 1);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "チャットを開始できませんでした");
    } finally {
      setCreatingRoom(false);
      setShowRoomModal(false);
    }
  }

  async function handleLogin(name: string, password: string) {
    await login(name, password);
    setUserName(name);
    localStorage.setItem("user_name", name);
    setAuthenticated(true);
  }

  async function handleRegister(name: string, password: string) {
    await register(name, password);
    await login(name, password);
    setUserName(name);
    localStorage.setItem("user_name", name);
    setAuthenticated(true);
  }

  if (!authenticated) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className={`app ${pinPanelOpen ? "pin-open" : "pin-closed"}`}>
      <Topbar />
      <Sidebar
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        onDeleteRoom={() => setActiveRoomId(null)}
        userName={userName}
        refreshTrigger={roomListVersion}
      />
      <ChatMain
        roomId={activeRoomId}
        onStartChat={handleStartChat}
        pinPanelOpen={pinPanelOpen}
        onTogglePin={() => setPinPanelOpen((o) => !o)}
        onRoomCreated={(id) => {
          setActiveRoomId(id);
          setRoomListVersion((v) => v + 1);
        }}
      />
      {pinPanelOpen && <PinPanel roomId={activeRoomId} onClose={() => setPinPanelOpen(false)} />}
      {error && <div className="app-error">{error}</div>}

      {/* ルーム名入力モーダル */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <i className="ti ti-message-circle" />
              <span>新しいチャットを作成</span>
            </div>
            <p className="modal-sub">チャットルームの名前を入力してください</p>
            <input
              className="modal-input"
              type="text"
              placeholder="例：デザインチーム、バグ報告…"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              autoFocus
              maxLength={40}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowRoomModal(false)}>
                キャンセル
              </button>
              <button
                className="modal-submit"
                onClick={handleCreateRoom}
                disabled={creatingRoom}
              >
                {creatingRoom ? "作成中…" : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
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
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            ログイン
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
            登録
          </button>
        </div>
        <label className="auth-field">
          <span>ユーザー名</span>
          <input autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="auth-field">
          <span>パスワード</span>
          <input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" disabled={submitting} type="submit">
          {submitting ? "送信中..." : mode === "login" ? "ログイン" : "登録して開始"}
        </button>
      </form>
    </main>
  );
}