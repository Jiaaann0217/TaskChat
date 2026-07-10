import "./Topbar.css";

type Props = {
  userName: string;
  avatarColor: string;
  onLogout: () => void;
  onOpenProfile: () => void;
};

export default function Topbar({ userName, avatarColor, onLogout, onOpenProfile }: Props) {
  return (
    <header className="topbar">
      ...
      <div className="topbar-actions">
        <i className="ti ti-search" title="検索" />
        <i className="ti ti-bell" title="通知" />
        <i className="ti ti-settings" title="設定" onClick={onOpenProfile} />
      </div>

      {userName && (
        <div className="topbar-user">
          <div className="topbar-avatar" style={{ background: avatarColor }} onClick={onOpenProfile} title="プロフィール設定">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <button className="topbar-logout" onClick={onLogout} title="ログアウト">
            <i className="ti ti-logout" />
          </button>
        </div>
      )}
    </header>
  );
}