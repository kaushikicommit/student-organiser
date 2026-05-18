export default function AIStudySuggestions({ subjects, tasks }) {
  return (
    <div className="card">
      <h3 className="card-title">🤖 AI Study Suggestions</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        Based on your pending tasks and study gaps, focus on:
      </p>
      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', color: 'white' }}>
        {subjects?.slice(0, 3).map(s => <li key={s._id}>{s.name}</li>)}
      </ul>
    </div>
  );
}