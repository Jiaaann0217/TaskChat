import "./Topbar.css";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-logo">
        <i className="ti ti-messages" />
        <span>チームタスク</span>
      </div>

      <div className="topbar-divider" />

      <div className="topbar-room">
        <span>プロジェクト名</span>
        <i className="ti ti-chevron-down" />
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <i className="ti ti-search" title="検索" />
        <i className="ti ti-bell" title="通知" />
        <i className="ti ti-settings" title="設定" />
      </div>

      <div className="topbar-avatar">—</div>
    </header>
  );
}