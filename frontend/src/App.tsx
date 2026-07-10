import { useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import ChatMain from "./components/ChatMain";
import PinPanel from "./components/PinPanel";
import { createRoom, createTask, isAuthenticated, login, logout, register } from "./api";
import "./App.css";

// モーダルの用途
type ModalMode = "room" | "task";

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [roomListVersion, setRoomListVersion] = useState(0);
  const [taskListVersion, setTaskListVersion] = useState(0);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("user_name") ?? ""
  );
  const [pinPanelOpen, setPinPanelOpen] = useState(true);
  const [pinRefreshTrigger, setPinRefreshTrigger] = useState(0);

  // 汎用モーダル
  const [modalMode, setModalMode] = useState<ModalMode>("room");
  const [showModal, setShowModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // チャット開始ボタン → ルーム作成モーダル
  function handleStartChat() {
    setModalMode("room");
    setModalInput("");
    setShowModal(true);
  }

  // やりますボタン → タスク追加モーダル
  function handleYarimasu() {
    setModalMode("task");
    setModalInput("");
    setShowModal(true);
  }

  // モーダル確定
  async function handleModalSubmit() {
    setSubmitting(true);
    try {
      if (modalMode === "room") {
        const name = modalInput.trim() || "新しいチャット";
        const newRoom = await createRoom(name);
        setActiveRoomId(newRoom.id);
        setRoomListVersion((v) => v + 1);
      } else {
        const title = modalInput.trim() || "新しい作業";
        const task = await createTask(title);
        setTaskListVersion((v) => v + 1);
        setRoomListVersion((v) => v + 1);
        if (task.roomId) {
          setActiveRoomId(task.roomId);      // ← 作成された作業チャットに自動で移動
        }
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setSubmitting(false);
      setShowModal(false);
    }
  }

  function handleLogout() {
    logout();
    localStorage.removeItem("user_name");
    setAuthenticated(false);
    setUserName("");
    setActiveRoomId(null);
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

  const isTask = modalMode === "task";

  return (
    <div className={`app ${pinPanelOpen ? "pin-open" : "pin-closed"}`}>
      <Topbar userName={userName} onLogout={handleLogout} />
      <Sidebar
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        onDeleteRoom={() => setActiveRoomId(null)}
        onStartChat={handleStartChat}
        userName={userName}
        refreshTrigger={roomListVersion}
        taskRefreshTrigger={taskListVersion}
      />
      <ChatMain
        roomId={activeRoomId}
        onStartChat={handleStartChat}
        onYarimasu={handleYarimasu}
        pinPanelOpen={pinPanelOpen}
        onTogglePin={() => setPinPanelOpen((o) => !o)}
        onPinChange={() => setPinRefreshTrigger((v) => v + 1)}
      />
      {pinPanelOpen && <PinPanel roomId={activeRoomId} onClose={() => setPinPanelOpen(false)} refreshTrigger={pinRefreshTrigger} />}
      {error && <div className="app-error">{error}</div>}

      {/* 汎用モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <i className={`ti ${isTask ? "ti-checkbox" : "ti-message-circle"}`} />
              <span>{isTask ? "作業を追加" : "新しいチャットを作成"}</span>
            </div>
            <p className="modal-sub">
              {isTask
                ? "引き受ける作業の名前を入力してください"
                : "チャットルームの名前を入力してください"}
            </p>
            <input
              className="modal-input"
              type="text"
              placeholder={isTask ? "例：デザイン修正、バグ調査…" : "例：デザインチーム、バグ報告…"}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
              autoFocus
              maxLength={40}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>
                キャンセル
              </button>
              <button
                className="modal-submit"
                onClick={handleModalSubmit}
                disabled={submitting}
              >
                {submitting ? "追加中…" : isTask ? "作業に追加" : "作成する"}
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