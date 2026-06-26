import { useEffect, useState } from "react";
import { fetchPins, fetchContributions } from "../api.js";
import "./PinPanel.css";

const TABS = ["重要連絡", "決定事項", "リンク"];

export default function PinPanel({ roomId }) {
  const [activeTab, setActiveTab] = useState(0);
  const [pins, setPins] = useState([]);
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    fetchPins(roomId).then(setPins);
    fetchContributions().then(setContributions);
  }, [roomId]);

  return (
    <div className="pin-panel">
      {/* ヘッダー */}
      <div className="pp-header">
        <i className="ti ti-notebook" />
        <span className="pp-title">ピン止めノート</span>
        <i className="ti ti-layout-sidebar-right pp-close" title="閉じる" />
      </div>

      {/* タブ */}
      <div className="pp-tabs">
        {TABS.map((tab, i) => (
          <div
            key={tab}
            className={`pp-tab ${activeTab === i ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* ピンカード一覧 */}
      <div className="pp-body">
        {pins.length === 0 ? (
          <p className="pp-empty">ピン止めがありません</p>
        ) : (
          pins.map((pin) => (
            <div key={pin.id} className="pin-card">
              <div className="pin-card-tag">
                <i className="ti ti-pin" />重要
              </div>
              <div className="pin-card-text">{pin.body}</div>
              <div className="pin-card-meta">
                {pin.created_by_name} · {pin.date_label}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 貢献度セクション */}
      <div className="contrib-section">
        <div className="contrib-head">今月の貢献度</div>
        {contributions.length === 0 ? (
          <p className="pp-empty">データがありません</p>
        ) : (
          contributions.map((c) => (
            <div key={c.user_id} className="contrib-row">
              <div
                className="contrib-av"
                style={{ background: c.avatar_bg, color: c.avatar_fg }}
              >
                {c.avatar_label}
              </div>
              <span className="contrib-name">{c.name}</span>
              <div className="c-track">
                <div
                  className="c-fill"
                  style={{ width: `${c.pct}%`, background: c.color }}
                />
              </div>
              <span className="contrib-n">{c.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
