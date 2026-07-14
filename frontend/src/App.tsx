import { useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import ChatMain from "./components/ChatMain";
import PinPanel from "./components/PinPanel";
import { createRoom, createTask, isAuthenticated, login, logout, register, updateProfile, createWorkspace } from "./api";
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
  const [avatarColor, setAvatarColor] = useState<string>(
    () => localStorage.getItem("avatar_color") ?? "#1C7293"
  );
  const [pinPanelOpen, setPinPanelOpen] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");   // ChatMainに実際に渡す確定した検索語
  const [searchToken, setSearchToken] = useState(0);     // 同じ語を再検索した時にも反応させるためのトリガー
  const [jumpMessageId, setJumpMessageId] = useState<number | null>(null);
  const [jumpToken, setJumpToken] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileColor, setProfileColor] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [pinRefreshTrigger, setPinRefreshTrigger] = useState(0);
  const [recruitMessageId, setRecruitMessageId] = useState<number | null>(null);

  // 汎用モーダル
  const [modalMode, setModalMode] = useState<ModalMode>("room");
  const [showModal, setShowModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [modalDueDate, setModalDueDate] = useState("");
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
    setModalDueDate("");
    setRecruitMessageId(null);
    setShowModal(true);
  }

  // 募集チャット投稿時 → タスク追加モーダル（メッセージ本文を初期値にセット）
  function handleRecruitPosted(title: string, messageId: number) {
    setModalMode("task");
    setModalInput(title);
    setModalDueDate("");
    setRecruitMessageId(messageId);
    setShowModal(true);
  }

  function handleRoomJoined(roomId: number | null) {
    setRoomListVersion((v) => v + 1);
    setTaskListVersion((v) => v + 1);
    if (roomId) setActiveRoomId(roomId);
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
        const task = await createTask(title, modalDueDate || null, recruitMessageId);
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
      setRecruitMessageId(null);
    }
  }

  function handleOpenSearch() {
    setSearchInput("");
    setShowSearchModal(true);
  }

  function handleRunSearch() {
    const q = searchInput.trim();
    if (!q) return;
    setSearchQuery(q);
    setSearchToken((v) => v + 1);
    setShowSearchModal(false);
  }

  function handleJumpToMessage(messageId: number) {
    setJumpMessageId(messageId);
    setJumpToken((v) => v + 1);
  }

  function handleOpenProfile() {
    setProfileName(userName);
    setProfileColor(avatarColor);
    setProfileError("");
    setShowProfileModal(true);
  }

  async function handleProfileSubmit() {
    setProfileSubmitting(true);
    setProfileError("");
    try {
      const name = profileName.trim();
      const result = await updateProfile(name || null, profileColor || null);
      setUserName(result.name);
      setAvatarColor(result.avatarColor);
      localStorage.setItem("user_name", result.name);
      setShowProfileModal(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setProfileSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    localStorage.removeItem("user_name");
    setAuthenticated(false);
    setUserName("");
    setActiveRoomId(null);
  }

  async function handleLogin(name: string, password: string, workspaceCode: string) {
    const result = await login(name, password, workspaceCode);
    setUserName(result.name);
    setAvatarColor(result.avatarColor);
    localStorage.setItem("user_name", result.name);
    setAuthenticated(true);
  }

  async function handleRegister(name: string, password: string, workspaceCode: string) {
    await register(name, password, workspaceCode);
    const result = await login(name, password, workspaceCode);
    setUserName(result.name);
    setAvatarColor(result.avatarColor);
    localStorage.setItem("user_name", result.name);
    setAuthenticated(true);
  }

  if (!authenticated) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const isTask = modalMode === "task";

  return (
    <div className={`app ${pinPanelOpen ? "pin-open" : "pin-closed"}`}>
      <Topbar userName={userName} avatarColor={avatarColor} onLogout={handleLogout} onOpenProfile={handleOpenProfile} onOpenSearch={handleOpenSearch} />
      <Sidebar
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
        onDeleteRoom={() => setActiveRoomId(null)}
        onStartChat={handleStartChat}
        onAddTask={handleYarimasu}
        userName={userName}
        avatarColor={avatarColor}
        onOpenProfile={handleOpenProfile}
        refreshTrigger={roomListVersion}
        taskRefreshTrigger={taskListVersion}
      />
      <ChatMain
        roomId={activeRoomId}
        onStartChat={handleStartChat}
        onRecruitPosted={handleRecruitPosted}
        onRoomJoined={handleRoomJoined}
        pinPanelOpen={pinPanelOpen}
        onTogglePin={() => setPinPanelOpen((o) => !o)}
        onPinChange={() => setPinRefreshTrigger((v) => v + 1)}
        onTaskComplete={() => setTaskListVersion((v) => v + 1)}
        searchQuery={searchQuery}
        searchToken={searchToken}
        jumpMessageId={jumpMessageId}
        jumpToken={jumpToken}
      />
      {pinPanelOpen && <PinPanel roomId={activeRoomId} onClose={() => setPinPanelOpen(false)} refreshTrigger={pinRefreshTrigger} onJumpToMessage={handleJumpToMessage} />}
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
                ? "募集した作業のタイトルと期限を設定してください"
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
            {isTask && (
              <label className="auth-field">
                <span>期限（任意）</span>
                <input
                  className="modal-input"
                  type="date"
                  value={modalDueDate}
                  onChange={(e) => setModalDueDate(e.target.value)}
                />
              </label>
            )}
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

      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <i className="ti ti-search" />
              <span>メッセージを検索</span>
            </div>
            <p className="modal-sub">このチャット内から検索します</p>
            <input
              className="modal-input"
              type="text"
              placeholder="検索したい語を入力…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunSearch()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowSearchModal(false)}>
                キャンセル
              </button>
              <button className="modal-submit" onClick={handleRunSearch}>
                検索
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <i className="ti ti-user-circle" />
              <span>プロフィール設定</span>
            </div>
            <p className="modal-sub">名前とアイコンの色を変更できます</p>
            <input
              className="modal-input"
              type="text"
              placeholder="名前"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              maxLength={20}
            />
            <div className="color-picker-row">
              {["#1C7293", "#378ADD", "#02C39A", "#7F77DD", "#E24B4A", "#D97706"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${profileColor === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setProfileColor(c)}
                />
              ))}
            </div>
            {profileError && <p className="auth-error">{profileError}</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowProfileModal(false)}>
                キャンセル
              </button>
              <button className="modal-submit" onClick={handleProfileSubmit} disabled={profileSubmitting}>
                {profileSubmitting ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type AuthScreenProps = {
  onLogin: (name: string, password: string, workspaceCode: string) => Promise<void>;
  onRegister: (name: string, password: string, workspaceCode: string) => Promise<void>;
};

function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<"choose" | "create" | "join">("choose");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const ws = await createWorkspace(newWorkspaceName);
      setWorkspaceCode(ws.code);
      setRegisterStep("join"); // 作成後、そのままユーザー登録フォームへ
    } catch (err) {
      setError(err instanceof Error ? err.message : "ワークスペースの作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "login") {
        await onLogin(name, password, workspaceCode);
      } else {
        await onRegister(name, password, workspaceCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={mode === "register" && registerStep === "create" ? handleCreateWorkspace : handleSubmit}>
        <div className="auth-brand">
          <i className="ti ti-messages" />
          <span>TaskChat</span>
        </div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => { setMode("login"); setError(""); }}>
            ログイン
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => { setMode("register"); setRegisterStep("choose"); setError(""); }}>
            登録
          </button>
        </div>

        {mode === "register" && registerStep === "choose" && (
          <>
            <p className="modal-sub">新しくワークスペースを作りますか？それとも招待コードで参加しますか？</p>
            <button type="button" className="auth-submit" onClick={() => setRegisterStep("create")}>
              新しいワークスペースを作る
            </button>
            <button type="button" className="modal-cancel" onClick={() => setRegisterStep("join")}>
              招待コードで参加する
            </button>
          </>
        )}

        {mode === "register" && registerStep === "create" && (
          <>
            <label className="auth-field">
              <span>ワークスペース名</span>
              <input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} required placeholder="例：〇〇プロジェクト" />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" disabled={submitting} type="submit">
              {submitting ? "作成中…" : "作成する"}
            </button>
          </>
        )}

        {((mode === "register" && registerStep === "join") || mode === "login") && (
          <>
            {mode === "register" && workspaceCode && (
              <p className="modal-sub">
                招待コード: <strong>{workspaceCode}</strong>（メンバーに共有してください）
              </p>
            )}
            <label className="auth-field">
              <span>招待コード</span>
              <input value={workspaceCode} onChange={(e) => setWorkspaceCode(e.target.value.toUpperCase())} required placeholder="例：A1B2C3D4" />
            </label>
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
          </>
        )}
      </form>
    </main>
  );
}