import "./YarimasuButton.css";

type Props = {
  messageId: number;
  done?: boolean;
  onYarimasu: (messageId: number) => void;
};

export default function YarimasuButton({ messageId, done = false, onYarimasu }: Props) {
  if (done) {
    return (
      <div className="yarimasu-done">
        <i className="ti ti-check" />
        対応済み
      </div>
    );
  }

  return (
    <button
      className="yarimasu-btn"
      onClick={() => onYarimasu(messageId)}
    >
      <i className="ti ti-hand-stop" />
      やります
    </button>
  );
}
