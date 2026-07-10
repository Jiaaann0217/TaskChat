import { useEffect, useRef, useState } from "react";
import { fetchRooms, fetchTasks, deleteRoom, deleteTask, type Room, type Task } from "../api";
import "./Sidebar.css";

type Props = {
  activeRoomId: number | null;
  onSelectRoom: (id: number) => void;
  onDeleteRoom?: () => void;
  onStartChat: () => void;
  userName: string;
  refreshTrigger: number;
  taskRefreshTrigger: number;
};

type ContextMenu = { x: number; y: number; roomId: number };

export default function Sidebar({ activeRoomId, onSelectRoom, onDeleteRoom, onStartChat, userName, refreshTrigger, taskRefreshTrigger }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetchRooms().then(setRooms);
  }, [refreshTrigger]);

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, [taskRefreshTrigger]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleContextMenu(e: React.MouseEvent, roomId: number) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, roomId });
  }

  async function handleDelete(roomId: number) {
    setContextMenu(null);
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) onDeleteRoom?.();
    } catch {
      // エラーは無視
    }
  }

  async function handleDeleteTask(task: Task) {
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (task.roomId) {
        setRooms((prev) => prev.filter((r) => r.id !== task.roomId));   // ← 追加
      }
      if (task.roomId && activeRoomId === task.roomId) onDeleteRoom?.();
    } catch {
      // エラーは無視
    }
  }

  // タスクに紐づいているルームIDの集合（作業チャット）
  const taskRoomIds = new Set(tasks.map((t) => t.roomId).filter((id): id is number => id !== null));

  // 通常のチャット一覧には作業チャットを表示しない
  const normalRooms = rooms.filter((r) => !taskRoomIds.has(r.id));

  return (
    <aside className="sidebar">
      <div className="sidebar-sec-row">
        <div className="sidebar-sec">チャット</div>
        <button className="sidebar-add-btn" onClick={onStartChat} title="新しいチャット">
          <i className="ti ti-plus" />
        </button>
      </div>

      {normalRooms.length === 0 ? (
        <p className="sidebar-empty">チャットルームがありません</p>
      ) : (
        normalRooms.map((room) => (
          <div
            key={room.id}
            className={`nav-item ${room.id === activeRoomId ? "active" : ""}`}
            onClick={() => onSelectRoom(room.id)}
            onContextMenu={(e) => handleContextMenu(e, room.id)}
          >
            <i className={`ti ${room.icon}`} />
            <span className="ni-name">{room.name}</span>
            {(room.unread ?? 0) > 0 && (
              <span className="ni-badge">{room.unread}</span>
            )}
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

      <div className="sidebar-sec">作業一覧</div>

      {tasks.length === 0 ? (
        <p className="sidebar-empty">タスクがありません</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`task-row ${task.overdue ? "overdue" : ""} ${task.roomId ? "clickable" : ""} ${task.roomId && task.roomId === activeRoomId ? "active" : ""}`}
            onClick={() => task.roomId && onSelectRoom(task.roomId)}
          >
            <div className="ni-dot" style={{ background: task.color }} />
            <span className="t-name">{task.title}</span>
            <span className="t-due">{task.due_label}</span>
            <button
              className="ni-delete-btn"
              title="削除"
              onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
            >
              <i className="ti ti-trash" />
            </button>
          </div>
        ))
      )}

      <hr className="sidebar-divider" />

      <div className="me-box">
        {userName ? (
          <div className="me-top">
            <div className="me-avatar">{userName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="me-name">{userName}</div>
              <div className="me-role">メンバー</div>
            </div>
          </div>
        ) : (
          <p className="sidebar-empty">ログインしていません</p>
        )}
      </div>

      {contextMenu && (
        <ul
          ref={menuRef}
          className="ctx-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <li className="ctx-item" onClick={() => { onSelectRoom(contextMenu.roomId); setContextMenu(null); }}>
            <i className="ti ti-message-circle" />チャットを開く
          </li>
          <li className="ctx-item">
            <i className="ti ti-users" />参加メンバーを見る
          </li>
          <li className="ctx-divider" />
          <li className="ctx-item ctx-item--danger" onClick={() => handleDelete(contextMenu.roomId)}>
            <i className="ti ti-trash" />削除する
          </li>
        </ul>
      )}
    </aside>
  );
}