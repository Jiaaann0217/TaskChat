import "./EmptyChat.css";

type Props = {
  onStartChat: () => void;
};

export default function EmptyChat({ onStartChat }: Props) {
  return (
    <div className="empty-chat">
      <div className="ec-icon">
        <i className="ti ti-messages" />
      </div>
      <p className="ec-title">チャットを始めましょう</p>
      <p className="ec-sub">
        左のリストからルームを選ぶか、
        <br />
        新しいチャットを開始してください
      </p>
      <button className="ec-btn" onClick={onStartChat}>
        <i className="ti ti-plus" />
        チャットを開始
      </button>
    </div>
  );
}
