import { useState } from "react";
import Topbar from "./components/Topbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatMain from "./components/ChatMain.jsx";
import PinPanel from "./components/PinPanel.jsx";
import "./App.css";

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState(null);

  return (
    <div className="app">
      <Topbar />
      <Sidebar activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
      <ChatMain roomId={activeRoomId} />
      <PinPanel roomId={activeRoomId} />
    </div>
  );
}
