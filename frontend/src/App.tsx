import { useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import ChatMain from "./components/ChatMain";
import PinPanel from "./components/PinPanel";
import "./App.css";

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  // チャット開始ボタンが押されたとき
  // バックエンド接続後はここで新規ルーム作成APIを呼ぶ
  function handleStartChat() {
    console.log("チャット開始");
    // const newRoom = await createRoom();
    // setActiveRoomId(newRoom.id);
  }

  return (
    <div className="app">
      <Topbar />
      <Sidebar activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
      <ChatMain roomId={activeRoomId} onStartChat={handleStartChat} />
      <PinPanel roomId={activeRoomId} />
    </div>
  );
}
