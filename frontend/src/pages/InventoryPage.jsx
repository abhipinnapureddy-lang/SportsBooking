import { useEffect, useState } from 'react';
import { fetchInventory, createInventoryEntry } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function InventoryPage() {
  const { token, user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ equipment_id: '', transaction_type: 'addition', quantity: 0, balance: 0, reference: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInventory = async () => {
      const response = await fetchInventory(token);
      setInventory(response.data || []);
    };
    if (token) loadInventory();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.equipment_id || !form.transaction_type || form.quantity <= 0) {
      return setError('Please complete the inventory form.');
    }

    const payload = {
      equipment_id: Number(form.equipment_id),
      transaction_type: form.transaction_type,
      quantity: Number(form.quantity),
      balance: Number(form.balance),
      reference: form.reference,
      notes: form.notes
    };

    const response = await createInventoryEntry(token, payload);
    if (response.status !== 'success') {
      setError(response.message || 'Unable to save inventory entry.');
      return;
    }

    setMessage('Inventory entry saved successfully.');
    setForm({ equipment_id: '', transaction_type: 'addition', quantity: 0, balance: 0, reference: '', notes: '' });
    const refreshed = await fetchInventory(token);
    setInventory(refreshed.data || []);
  };

  if (!user) {
    return <div className="card">You must be signed in to view inventory.</div>;
  }

  return (
    <div>
      <div className="hero">
        <h2>Equipment inventory</h2>
        <p>Review stock movements and add inventory entries for campus sports equipment.</p>
      </div>

      {(message || error) && <div className={`alert ${message ? 'profile-success' : ''}`}>{message || error}</div>}

      <div className="grid grid-2">
        <section className="card">
          <h3>Inventory log</h3>
          {inventory.length === 0 ? (
            <p>No inventory activity available yet.</p>
          ) : (
            <div className="card-list">
              {inventory.map((entry) => (
                <div key={entry.id} className="card card-sm">
                  <p><strong>{entry.equipment_name}</strong> · {entry.transaction_type}</p>
                  <p>{entry.quantity} units · Balance {entry.balance}</p>
                  <p>{entry.reference || 'No reference'} · {new Date(entry.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <h3>Add inventory entry</h3>
          <form className="profile-form" onSubmit={handleSubmit}>
            <label>Equipment ID<input value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })} required /></label>
            <label>Transaction type<select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
              <option value="addition">Addition</option>
              <option value="removal">Removal</option>
              <option value="adjustment">Adjustment</option>
            </select></label>
            <label>Quantity<input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
            <label>Balance<input type="number" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required /></label>
            <label>Reference<input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <button className="button">Save inventory</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default InventoryPage;