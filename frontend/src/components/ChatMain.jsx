import { useEffect, useState } from "react";
import { fetchMessages, sendMessage } from "../api.js";
import "./ChatMain.css";

export default function ChatMain({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!roomId) return;
    fetchMessages(roomId).then(setMessages);
  }, [roomId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !roomId) return;
    await sendMessage(roomId, text);
    setInput("");
    // 送信後に再取得
    fetchMessages(roomId).then(setMessages);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!roomId) {
    return (
      <div className="main">
        <div className="chat-empty">チャットルームを選択してください</div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* チャットヘッダー */}
      <div className="chat-header">
        <div className="ch-icon">
          <i className="ti ti-users" />
        </div>
        <span className="ch-title">
          {/* ルーム名はAPIから取得後に表示 */}
          {roomId ? `ルーム #${roomId}` : "—"}
        </span>
        <div className="ch-members">{/* メンバーアバターが入る */}</div>
        <button className="ch-btn">
          <i className="ti ti-pin" />ピン止め
        </button>
        <button className="ch-btn">
          <i className="ti ti-layout-columns" />作業を選択
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="messages">
        {messages.length === 0 ? (
          <p className="chat-empty-inner">メッセージがありません</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="msg">
              <div
                className="msg-av"
                style={{ background: msg.avatar_bg, color: msg.avatar_fg }}
              >
                {msg.avatar_label}
              </div>
              <div className="msg-body">
                <div className="msg-meta">
                  <span className="msg-name">{msg.user_name}</span>
                  <span className="msg-time">{msg.time_label}</span>
                </div>
                <div className="msg-text">{msg.body}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 入力エリア */}
      <div className="input-area">
        <div className="input-row">
          <i className="ti ti-paperclip" title="添付" />
          <textarea
            className="msg-input"
            placeholder="メッセージを入力…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <i className="ti ti-mood-smile" title="絵文字" />
          <button className="send-btn" onClick={handleSend} title="送信">
            <i className="ti ti-send" />
          </button>
        </div>
      </div>
    </div>
  );
}
