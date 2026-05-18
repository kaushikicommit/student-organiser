export default function FocusMusicPlayer() {
  return (
    <div className="card">
      <h3 className="card-title">🎵 Focus Music</h3>
      <p style={{ color: 'var(--text-muted)' }}>Lo-fi beats to study & relax</p>
      <iframe
        width="100%"
        height="166"
        src="https://www.youtube.com/embed/jfKfPfyJRdk"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ borderRadius: '0.5rem', marginTop: '0.5rem' }}
      ></iframe>
    </div>
  );
}