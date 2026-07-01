import { useEffect, useState } from "react";
import { fetchRooms, fetchTasks } from "../api.js";
import "./Sidebar.css";

export default function Sidebar({ activeRoomId, onSelectRoom, userName }) {
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchRooms().then(setRooms);
    fetchTasks().then(setTasks);
  }, []);

  return (
    <aside className="sidebar">
      {/* チャットセクション */}
      <div className="sidebar-sec">チャット</div>

      {rooms.length === 0 ? (
        <p className="sidebar-empty">チャットルームがありません</p>
      ) : (
        rooms.map((room) => (
          <div
            key={room.id}
            className={`nav-item ${room.id === activeRoomId ? "active" : ""}`}
            onClick={() => onSelectRoom(room.id)}
          >
            <i className={`ti ${room.icon}`} />
            <span className="ni-name">{room.name}</span>
            {room.unread > 0 && (
              <span className="ni-badge">{room.unread}</span>
            )}
          </div>
        ))
      )}

      <hr className="sidebar-divider" />

      {/* 作業一覧セクション */}
      <div className="sidebar-sec">作業一覧</div>

      {tasks.length === 0 ? (
        <p className="sidebar-empty">タスクがありません</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`task-row ${task.overdue ? "overdue" : ""}`}
          >
            <div className="ni-dot" style={{ background: task.color }} />
            <span className="t-name">{task.title}</span>
            <span className="t-due">{task.due_label}</span>
          </div>
        ))
      )}

      <hr className="sidebar-divider" />

      {/* 自分情報ボックス（ログイン後に表示） */}
      <div className="me-box">
        {userName ? (
          <div className="me-top">
            <div className="me-avatar">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="me-name">{userName}</div>
              <div className="me-role">メンバー</div>
            </div>
          </div>
        ) : (
          <p className="sidebar-empty">ログインしていません</p>
        )}
      </div>
    </aside>
  );
}