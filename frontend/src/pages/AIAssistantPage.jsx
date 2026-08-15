import { useState } from 'react';
import { askSportsAssistant } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function AIAssistantPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true); setError('');
    try {
      const response = await askSportsAssistant(token, question);
      if (response.status !== 'success') setError(response.message || 'Unable to get a recommendation.');
      else setResult(response.data);
    } catch { setError('Unable to connect to the sports assistant.'); }
    finally { setLoading(false); }
  };

  const examples = ['Which sport should I try?', 'What equipment do I need for badminton?', 'Find a free slot', 'What are the basic football rules?'];

  return <div className="module-page">
    <section className="module-heading"><div><p className="eyebrow">Smart campus AI</p><h2>AI Sports Assistant</h2><p>Get sports recommendations, equipment guidance, free-slot suggestions and basic sports answers.</p></div></section>
    <section className="card">
      <form className="profile-form" onSubmit={ask}>
        <label>Ask your question<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about sports, equipment or free slots..." rows="4" /></label>
        <button className="button" disabled={loading}>{loading ? 'Thinking…' : 'Ask assistant'}</button>
      </form>
      <div className="chip-list" style={{marginTop:'1rem'}}>{examples.map(x=><button type="button" className="button button-secondary" key={x} onClick={()=>setQuestion(x)}>{x}</button>)}</div>
    </section>
    {error && <div className="alert">{error}</div>}
    {result && <section className="card" style={{marginTop:'1rem'}}><h3>Assistant response</h3><p>{result.recommendation}</p>
      {result.sports?.length > 0 && <div className="card-list">{result.sports.map(s=><div className="card card-sm" key={s.id}><b>{s.name}</b><span>{s.description || 'Campus sport'}</span></div>)}</div>}
      {result.equipment?.length > 0 && <div className="card-list">{result.equipment.map(item=><div className="card card-sm" key={item.id}><b>{item.name}</b><span>{item.category} · {item.available_quantity} available · {item.item_condition} condition</span></div>)}</div>}
      {result.slots?.length > 0 && <div className="card-list">{result.slots.map(slot=><div className="card card-sm" key={slot.id}><b>{slot.ground_name}</b><span>{slot.sport_name} · {new Date(slot.start_time).toLocaleString()} → {new Date(slot.end_time).toLocaleTimeString()}</span></div>)}</div>}
    </section>}
  </div>;
}
export default AIAssistantPage;
