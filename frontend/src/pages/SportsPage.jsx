import { useEffect, useState } from 'react';
import { fetchEquipment, fetchGrounds, fetchSports } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const fallbackSports = ['Cricket','Football','Basketball','Volleyball','Badminton','Kabaddi','Table Tennis','Chess','Carrom','Athletics'];
const icons = { Cricket:'🏏', Football:'⚽', Basketball:'🏀', Volleyball:'🏐', Badminton:'🏸', 'Table Tennis':'🏓', Chess:'♟️', Carrom:'🎯', Kabaddi:'🤼', Athletics:'🏃' };

function SportsPage() {
  const { token } = useAuth();
  const [sports, setSports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [grounds, setGrounds] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchSports(search).then((r) => setSports(r.data?.length ? r.data : fallbackSports.map((name) => ({ name, description: `${name} campus sport` })))); }, [search]);

  const choose = async (sport) => {
    setSelected(sport);
    const allGrounds = await fetchGrounds({ sport_id: sport.id, status: 'approved' });
    const allEquipment = token ? await fetchEquipment(token, { sport_id: sport.id }) : { data: [] };
    setGrounds(allGrounds.data || []);
    setEquipment(allEquipment.data || []);
  };

  return <div className="module-page">
    <section className="module-heading"><div><p className="eyebrow">Sports management</p><h2>Choose your sport</h2><p>Explore supported campus sports, grounds and equipment. All campus facilities are free.</p></div></section>
    <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sports…" />
    <div className="card-list" style={{ marginTop: '1rem' }}>
      {sports.map((sport) => <button type="button" className="card" key={sport.id || sport.name} onClick={() => choose(sport)} style={{ textAlign: 'left', cursor: 'pointer' }}><h3>{icons[sport.name] || '🏅'} {sport.name}</h3><p>{sport.description}</p><span className="muted">View rules, grounds and equipment →</span></button>)}
    </div>
    {selected && <section className="grid grid-2" style={{ marginTop: '1rem' }}>
      <div className="card"><p className="eyebrow">{selected.name}</p><h2>Available grounds</h2>{grounds.length ? grounds.map((g) => <div className="card card-sm" key={g.id}><b>{g.name}</b><p>{g.description}</p><span>{g.city} · {g.status}</span></div>) : <p className="muted">No approved ground is linked to this sport yet.</p>}</div>
      <div className="card"><p className="eyebrow">{selected.name}</p><h2>Equipment</h2>{equipment.length ? equipment.map((e) => <div className="card card-sm" key={e.id}><b>{e.name}</b><p>{e.category} · {e.item_condition}</p><span>{e.available_quantity} available</span></div>) : <p className="muted">No equipment is linked to this sport yet.</p>}</div>
    </section>}
  </div>;
}
export default SportsPage;
