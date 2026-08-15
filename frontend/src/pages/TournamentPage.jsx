import { useEffect, useState } from 'react';
import { createTournament, fetchSports, fetchTournament, fetchTournaments, issueTournamentCertificate, registerTournamentTeam } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function TournamentPage() {
  const { token, user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', sport_id: '', description: '', start_date: '', end_date: '' });
  const canManage = ['admin', 'coordinator'].includes(user?.role);

  const load = async () => { const [t, s] = await Promise.all([fetchTournaments(token), fetchSports()]); setTournaments(t.data || []); setSports(s.data || []); };
  useEffect(() => { if (token) load(); }, [token]);
  const open = async (id) => { const result = await fetchTournament(token, id); if (result.status === 'success') setSelected(result.data); };
  const create = async (e) => { e.preventDefault(); setMessage(''); setError(''); const result = await createTournament(token, form); if (result.status !== 'success') return setError(result.message || 'Unable to create tournament.'); setMessage('Tournament created.'); setForm({ name:'', sport_id:'', description:'', start_date:'', end_date:'' }); load(); };
  const register = async (e) => { e.preventDefault(); const result = await registerTournamentTeam(token, selected.tournament.id, { name: teamName }); if (result.status !== 'success') return setError(result.message || 'Unable to register team.'); setMessage('Team registered successfully.'); setTeamName(''); open(selected.tournament.id); };
  const issue = async (team) => { const result = await issueTournamentCertificate(token, selected.tournament.id, { user_id: team.captain_id, title: `${selected.tournament.name} — Participation Certificate` }); if (result.status !== 'success') return setError(result.message || 'Unable to issue certificate.'); setMessage(`Certificate issued: ${result.data.certificate_code}`); open(selected.tournament.id); };

  return <div className="module-page">
    <section className="module-heading"><div><p className="eyebrow">Tournament management</p><h2>Campus tournaments</h2><p>Create tournaments, register teams, review fixtures, results, leaderboards and certificates.</p></div></section>
    {(message || error) && <div className={`alert ${message ? 'profile-success' : ''}`}>{message || error}</div>}
    {canManage && <form className="card profile-form" onSubmit={create}><h3>Create tournament</h3><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></label><label>Sport<select value={form.sport_id} onChange={e=>setForm({...form,sport_id:e.target.value})} required><option value="">Select sport</option>{sports.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></label><div className="grid grid-2"><label>Start date<input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} required /></label><label>End date<input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} required /></label></div><button className="button">Create tournament</button></form>}
    <div className="card-list" style={{ marginTop:'1rem' }}>{tournaments.map(t=><button type="button" className="card" key={t.id} onClick={()=>open(t.id)} style={{textAlign:'left',cursor:'pointer'}}><h3>{t.name}</h3><p>{t.sport_name} · {t.status}</p><p>{t.start_date?.slice(0,10)} → {t.end_date?.slice(0,10)}</p><span>{t.team_count} registered teams</span></button>)}</div>
    {selected && <div style={{marginTop:'1rem'}}>
      <section className="grid grid-2"><div className="card"><h2>{selected.tournament.name}</h2><p>{selected.tournament.description || 'Campus tournament'}</p><h3>Teams</h3>{selected.teams.length ? selected.teams.map(team=><div className="card card-sm" key={team.id}><b>{team.name}</b><span>{team.status}</span>{canManage && <button className="text-button" onClick={()=>issue(team)}>Issue certificate</button>}</div>) : <p className="muted">No teams registered yet.</p>}<form className="profile-form" onSubmit={register}><label>Register team<input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team name" required /></label><button className="button">Register team</button></form></div>
      <div className="card"><h3>Fixtures & results</h3>{selected.matches.length ? selected.matches.map(m=><div className="card card-sm" key={m.id}><b>{m.team_a_name} vs {m.team_b_name}</b><p>{m.score_a} — {m.score_b} · {m.status}</p><span>{m.venue || 'Venue TBA'} {m.scheduled_at ? `· ${new Date(m.scheduled_at).toLocaleString()}` : ''}</span></div>) : <p className="muted">Fixtures will appear here when created by the coordinator.</p>}</div></section>
      <section className="grid grid-2" style={{marginTop:'1rem'}}><div className="card"><h3>Leaderboard</h3>{selected.leaderboard?.length ? selected.leaderboard.map((row,index)=><div className="card card-sm" key={row.id}><b>#{index+1} {row.name}</b><p>{row.points} points · {row.wins}W {row.draws}D {row.losses}L · {row.score_for}:{row.score_against}</p></div>) : <p className="muted">Complete matches to build the leaderboard.</p>}</div><div className="card"><h3>Certificates</h3>{selected.certificates?.length ? selected.certificates.map(c=><div className="card card-sm" key={c.id}><b>{c.recipient_name}</b><p>{c.title}</p><span>{c.certificate_code}</span></div>) : <p className="muted">No certificates issued yet.</p>}</div></section>
    </div>}
  </div>;
}
export default TournamentPage;
