import { useEffect, useRef, useState } from "react";
import { fetchRooms, fetchTasks, deleteRoom } from "../api.js";
import "./Sidebar.css";

export default function Sidebar({ activeRoomId, onSelectRoom, onDeleteRoom, userName, refreshTrigger }) {
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, roomId }
  const menuRef = useRef(null);

  useEffect(() => {
    fetchRooms().then(setRooms);
    fetchTasks().then(setTasks);
  }, [refreshTrigger]);

  // コンテキストメニューの外クリックで閉じる
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleContextMenu(e, roomId) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, roomId });
  }

  async function handleDelete(roomId) {
    setContextMenu(null);
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) onDeleteRoom?.();
    } catch {
      // エラーは無視（後でエラーハンドリング追加可）
    }
  }

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
            onContextMenu={(e) => handleContextMenu(e, room.id)}
          >
            <i className={`ti ${room.icon}`} />
            <span className="ni-name">{room.name}</span>
            {room.unread > 0 && (
              <span className="ni-badge">{room.unread}</span>
            )}
            {/* ホバー時ゴミ箱 */}
            <button
              className="ni-delete-btn"
              title="削除"
              onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
            >
              <i className="ti ti-trash" />
            </button>
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

      {/* 自分情報ボックス */}
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

      {/* 右クリックコンテキストメニュー */}
      {contextMenu && (
        <ul
          ref={menuRef}
          className="ctx-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <li className="ctx-item" onClick={() => { onSelectRoom(contextMenu.roomId); setContextMenu(null); }}>
            <i className="ti ti-message-circle" />
            チャットを開く
          </li>
          <li className="ctx-item">
            <i className="ti ti-users" />
            参加メンバーを見る
          </li>
          <li className="ctx-divider" />
          <li className="ctx-item ctx-item--danger" onClick={() => handleDelete(contextMenu.roomId)}>
            <i className="ti ti-trash" />
            削除する
          </li>
        </ul>
      )}
    </aside>
  );
}