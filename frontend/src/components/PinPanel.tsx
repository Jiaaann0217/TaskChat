import { useEffect, useState } from "react";
import { fetchPins, fetchContributions, type Pin, type Contribution } from "../api";
import "./PinPanel.css";

type Props = {
  roomId: number | null;
  onClose: () => void;
  refreshTrigger: number;
};

export default function PinPanel({ roomId, onClose, refreshTrigger }: Props) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    if (!roomId) return;
    fetchPins(roomId).then(setPins);
    fetchContributions().then(setContributions);
  }, [roomId, refreshTrigger]);

  return (
    <div className="pin-panel">
      <div className="pp-header">
        <i className="ti ti-notebook" />
        <span className="pp-title">ピン止めノート</span>
        <i className="ti ti-layout-sidebar-right pp-close" title="閉じる" onClick={onClose} />
      </div>

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

      <div className="contrib-section">
        <div className="contrib-head">今月の貢献度</div>
        {contributions.length === 0 ? (
          <p className="pp-empty">データがありません</p>
        ) : (
          contributions.map((c, i) => (
            <div key={`${c.user_id}-${i}`} className="contrib-row">
              <div
                className="contrib-av"
                style={{ background: c.avatar_bg, color: c.avatar_fg }}
              >
                {c.avatar_label}
              </div>
              <div className="c-track">
                <div className="c-fill" style={{ width: `${c.pct}%`, background: c.color }} />
              </div>
              <span className="contrib-n">{c.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}