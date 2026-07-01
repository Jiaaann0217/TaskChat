import { useEffect, useRef, useState } from "react";
import { fetchMessages, sendMessage, createRoom, type Message } from "../api";
import EmptyChat from "./EmptyChat";
import YarimasuButton from "./YarimasuButton";
import "./ChatMain.css";

type Props = {
  roomId: number | null;
  onStartChat: () => void;
  pinPanelOpen: boolean;
  onTogglePin: () => void;
  onRoomCreated: (roomId: number) => void;
};

type LocalMessage = Message & { is_recruiting?: boolean };

export default function ChatMain({ roomId, onStartChat, pinPanelOpen, onTogglePin, onRoomCreated }: Props) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [recruiting, setRecruiting] = useState(false);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages(roomId).then(setMessages);
    setRecruiting(false);
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !roomId) return;
    await sendMessage(roomId, text);
    setInput("");
    fetchMessages(roomId).then((fetched: Message[]) => {
      const withFlag: LocalMessage[] = fetched.map((m, i) => {
        if (i === fetched.length - 1 && recruiting) {
          return { ...m, is_recruiting: true };
        }
        return m;
      });
      setMessages(withFlag);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleYarimasu(messageId: number) {
    setDoneIds((prev) => [...prev, messageId]);
    try {
      const newRoom = await createRoom();
      onRoomCreated(newRoom.id);
    } catch {
      // ルーム作成失敗でも対応済みは維持
    }
  }

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
          <i className="ti ti-message-circle-2" />
        </div>
        <span className="ch-title">ルーム #{roomId}</span>
        <div className="ch-members" />
        <button className={`ch-btn ${pinPanelOpen ? "ch-btn--pin-active" : ""}`} onClick={onTogglePin}>
          <i className={`ti ${pinPanelOpen ? "ti-pin-filled" : "ti-pin"}`} />
          <span>{pinPanelOpen ? "ピン止め中" : "ピン止め"}</span>
        </button>
        <button className="ch-btn">
          <i className="ti ti-layout-columns" />
          <span>作業を選択</span>
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="messages">
        {messages.length === 0 ? (
          <div className="chat-empty-inner">
            <i className="ti ti-message-off" />
            <p>まだメッセージがありません</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`msg ${msg.is_recruiting ? "msg--recruiting" : ""}`}>
              <div
                className="msg-av"
                style={{ background: msg.avatar_bg, color: msg.avatar_fg }}
              >
                {msg.avatar_label}
              </div>
              <div className="msg-body">
                <div className="msg-meta">
                  <span className="msg-name">
                    <i className="ti ti-user-circle" />
                    {msg.user_name}
                  </span>
                  <span className="msg-time">
                    <i className="ti ti-clock" />
                    {msg.time_label}
                  </span>
                  {msg.is_recruiting && (
                    <span className="msg-recruiting-badge">
                      <i className="ti ti-speakerphone" />
                      募集中
                    </span>
                  )}
                </div>
                <div className="msg-bubble-row">
                  <div className={`msg-bubble ${msg.is_recruiting ? "msg-bubble--recruiting" : ""}`}>
                    {msg.body}
                  </div>
                  <button className="msg-pin-btn" title="ピン止め">
                    <i className="ti ti-pin" />
                  </button>
                </div>
                {msg.is_recruiting && (
                  <YarimasuButton
                    messageId={msg.id}
                    done={doneIds.includes(msg.id)}
                    onYarimasu={handleYarimasu}
                  />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className={`input-area ${recruiting ? "input-area--recruiting" : ""}`}>
        {/* 募集モード中の告知バー */}
        {recruiting && (
          <div className="recruit-active-bar">
            <i className="ti ti-speakerphone" />
            <span>募集モード ON ― 送信すると「やります」ボタン付きで投稿されます</span>
            <button className="recruit-active-close" onClick={() => setRecruiting(false)}>
              <i className="ti ti-x" />
            </button>
          </div>
        )}
        <div className="input-row">
          <i className="ti ti-paperclip" title="ファイルを添付" />
          <textarea
            className="msg-input"
            placeholder={recruiting ? "募集内容を入力… (Enter で送信)" : "メッセージを入力… (Enter で送信)"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {/* 募集トグル：常時テキスト表示 */}
          <button
            className={`recruit-toggle ${recruiting ? "recruit-toggle--on" : ""}`}
            onClick={() => setRecruiting((r) => !r)}
            title={recruiting ? "募集を締め切る" : "募集メッセージを送る"}
          >
            <i className={`ti ${recruiting ? "ti-user-check" : "ti-speakerphone"}`} />
            <span>{recruiting ? "募集中" : "募集"}</span>
          </button>
          <i className="ti ti-mood-smile" title="絵文字を追加" />
          <button className="send-btn" onClick={handleSend} title="送信 (Enter)">
            <i className="ti ti-send" />
          </button>
        </div>
      </div>
    </div>
  );
}