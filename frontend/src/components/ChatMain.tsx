import { useEffect, useState } from "react";
import { fetchMessages, sendMessage, type Message } from "../api";
import EmptyChat from "./EmptyChat";
import YarimasuButton from "./YarimasuButton";
import "./ChatMain.css";

type Props = {
  roomId: number | null;
  onStartChat: () => void;
  pinPanelOpen: boolean;
  onTogglePin: () => void;
};

export default function ChatMain({ roomId, onStartChat, pinPanelOpen, onTogglePin }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  // やりますを押したメッセージIDを管理
  const [donIds, setDoneIds] = useState<number[]>([]);
  // 募集中かどうか
  const [recruiting, setRecruiting] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages(roomId).then(setMessages);
  }, [roomId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !roomId) return;
    await sendMessage(roomId, text);
    setInput("");
    fetchMessages(roomId).then(setMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleYarimasu(messageId: number) {
    setDoneIds((prev) => [...prev, messageId]);
    // バックエンド接続後はここでAPIを呼ぶ
    // await postYarimasu(messageId);
  }

  // ルーム未選択
  if (!roomId) {
    return (
      <div className="main">
        <EmptyChat onStartChat={onStartChat} />
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
        <span className="ch-title">ルーム #{roomId}</span>
        <div className="ch-members" />
        <button
          className={`ch-btn ${recruiting ? "ch-btn--active" : ""}`}
          onClick={() => setRecruiting((r) => !r)}
        >
          <i className={`ti ${recruiting ? "ti-user-check" : "ti-user-plus"}`} />
          {recruiting ? "募集締め切る" : "募集する"}
        </button>
        <button className={`ch-btn ${pinPanelOpen ? "ch-btn--active" : ""}`} onClick={onTogglePin}>
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
                <div className="msg-bubble-row">
                  <div className="msg-bubble">{msg.body}</div>
                  <button className="msg-pin-btn" title="ピン止め">
                    <i className="ti ti-pin" />
                  </button>
                </div>
                {/* やりますボタン：needs_response がなければ全メッセージに表示 */}
                {(msg.needs_response !== false) && (
                  <YarimasuButton
                    messageId={msg.id}
                    done={donIds.includes(msg.id)}
                    onYarimasu={handleYarimasu}
                  />
                )}
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
            <i className="ti ti-arrow-up" />
          </button>
        </div>
      </div>
    </div>
  );
}