import { useEffect, useRef, useState } from "react";
import { fetchMessages, sendMessage, fetchPins, createPin, fetchTaskByRoom, completeTask, type Message, type RoomTask } from "../api";
import EmptyChat from "./EmptyChat";
import YarimasuButton from "./YarimasuButton";
import "./ChatMain.css";

type Props = {
  roomId: number | null;
  onStartChat: () => void;
  onYarimasu: () => void;
  pinPanelOpen: boolean;
  onTogglePin: () => void;
  onPinChange: () => void;
  onTaskComplete: () => void;
  searchQuery: string;
  searchToken: number;
  jumpMessageId: number | null;
  jumpToken: number;
};

type LocalMessage = Message & { is_recruiting?: boolean };

export default function ChatMain({ roomId, onStartChat, onYarimasu, pinPanelOpen, onTogglePin, onPinChange, onTaskComplete, searchQuery, searchToken, jumpMessageId, jumpToken }: Props) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [recruiting, setRecruiting] = useState(false);
  const [doneIds, setDoneIds] = useState<number[]>([]);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [roomTask, setRoomTask] = useState<RoomTask | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const ws = useRef<WebSocket | null>(null);
  // 自分が送信したメッセージIDを記録してWS重複受信を防ぐ
  const sentIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!roomId) return;

    fetchMessages(roomId).then(setMessages);
    fetchPins(roomId).then((pins) => setPinnedIds(pins.map((p) => p.message_id)));
    fetchTaskByRoom(roomId).then(setRoomTask);
    setRecruiting(false);

    // WebSocket接続
    const wsBase = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/^http/, "ws");
    ws.current = new WebSocket(`${wsBase}/ws/${roomId}`);
    ws.current.onmessage = (event: MessageEvent) => {
      const message: LocalMessage = JSON.parse(event.data);
      // 自分が送ったメッセージはすでに画面に追加済みなのでスキップ
      if (sentIds.current.has(message.id)) {
        sentIds.current.delete(message.id);
        return;
      }
      setMessages((prev) => [...prev, message]);
    };

    ws.current.onerror = () => {
      // WS接続失敗はサイレントに無視（ポーリングで代替可能）
    };

    return () => {
      ws.current?.close();
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!searchQuery) return;

    const found = [...messages].reverse().find((m) => m.body.includes(searchQuery));

    if (found) {
      setSearchNotFound(false);
      setHighlightedId(found.id);
      messageRefs.current[found.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    } else {
      setSearchNotFound(true);
      const timer = setTimeout(() => setSearchNotFound(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchToken]);

  useEffect(() => {
    if (!jumpMessageId) return;

    setHighlightedId(jumpMessageId);
    messageRefs.current[jumpMessageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [jumpToken]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !roomId) return;

    // DBに保存して保存済みメッセージを取得
    const saved = await sendMessage(roomId, text, recruiting) as LocalMessage | undefined;
    setInput("");

    if (saved) {
      // 自分の画面に即追加
      const withFlag: LocalMessage = recruiting ? { ...saved, needs_response: true } : saved;
      setMessages((prev) => [...prev, withFlag]);

      // WSで全員に送信（自分のIDを記録して重複受信を防ぐ）
      sentIds.current.add(saved.id);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(withFlag));
      }
    } else {
      // savedが返らない場合（void）は再フェッチで対応
      fetchMessages(roomId).then((fetched: Message[]) => {
        const withFlag: LocalMessage[] = fetched.map((m, i) => {
          if (i === fetched.length - 1 && recruiting) {
            return { ...m, needs_response: true };
          }
          return m;
        });
        setMessages(withFlag);
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleYarimasu(messageId: number) {
    setDoneIds((prev) => [...prev, messageId]);
    onYarimasu(); // App.tsx のモーダルを開く
  }

  async function handlePin(messageId: number) {
    if (!roomId || pinnedIds.includes(messageId)) return;
    try {
      await createPin(roomId, messageId);
      setPinnedIds((prev) => [...prev, messageId]);
      onPinChange();
    } catch {
      // すでにピン止め済みなどのエラーは無視
    }
  }

  async function handleCompleteTask() {
    if (!roomTask || roomTask.done) return;
    try {
      await completeTask(roomTask.id);
      setRoomTask({ ...roomTask, done: true });
      onTaskComplete();   // サイドバーの作業一覧を更新
      onPinChange();      // 貢献度パネルを更新
    } catch {
      // エラーは無視
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
        {roomTask && (
          <button
            className={`ch-btn ${roomTask.done ? "ch-btn--done" : "ch-btn--complete"}`}
            onClick={handleCompleteTask}
            disabled={roomTask.done}
          >
            <i className={`ti ${roomTask.done ? "ti-check" : "ti-flag-3"}`} />
            <span>{roomTask.done ? "完了済み" : "作業完了"}</span>
          </button>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div className="messages">
        {searchNotFound && (
          <div className="search-not-found-toast">
            <i className="ti ti-alert-circle" />
            <span>「{searchQuery}」を含む発言は見つかりませんでした</span>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="chat-empty-inner">
            <i className="ti ti-message-off" />
            <p>まだメッセージがありません</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              ref={(el) => { messageRefs.current[msg.id] = el; }}
              className={`msg ${msg.is_recruiting ? "msg--recruiting" : ""} ${highlightedId === msg.id ? "msg--highlighted" : ""}`}
            >
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
                  {msg.needs_response && (
                    <span className="msg-recruiting-badge">
                      <i className="ti ti-speakerphone" />
                      募集中
                    </span>
                  )}
                </div>
                <div className="msg-bubble-row">
                  <div className={`msg-bubble ${msg.needs_response ? "msg-bubble--recruiting" : ""}`}>
                    {msg.body}
                  </div>
                  <button
                    className={`msg-pin-btn ${pinnedIds.includes(msg.id) ? "pinned" : ""}`}
                    title={pinnedIds.includes(msg.id) ? "ピン止め済み" : "ピン止め"}
                    onClick={() => handlePin(msg.id)}
                  >
                    <i className="ti ti-pin" />
                  </button>
                </div>
                {msg.needs_response && (
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
          <textarea
            className="msg-input"
            placeholder={recruiting ? "募集内容を入力… (Enter で送信)" : "メッセージを入力… (Enter で送信)"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`recruit-toggle ${recruiting ? "recruit-toggle--on" : ""}`}
            onClick={() => setRecruiting((r) => !r)}
            title={recruiting ? "募集を締め切る" : "募集メッセージを送る"}
          >
            <i className={`ti ${recruiting ? "ti-user-check" : "ti-speakerphone"}`} />
            <span>{recruiting ? "募集中" : "募集"}</span>
          </button>
          <button className="send-btn" onClick={handleSend} title="送信 (Enter)">
            <i className="ti ti-send" />
          </button>
        </div>
      </div>
    </div>
  );
}
