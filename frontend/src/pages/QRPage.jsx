import { useEffect, useRef, useState } from 'react';
import { equipmentQrAction, fetchEquipmentReservations } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const makePayload = (reservationId) => JSON.stringify({ type: 'equipment_reservation', reservation_id: Number(reservationId) });

function QRPage() {
  const { token, user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [action, setAction] = useState('issue');
  const [manual, setManual] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { if (token) fetchEquipmentReservations(token).then(r => setReservations(r.data || [])); }, [token]);
  useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);

  const qrValue = selectedId ? makePayload(selectedId) : '';
  const qrImage = qrValue ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrValue)}` : '';

  const runAction = async (reservationId) => {
    setMessage(''); setError('');
    const result = await equipmentQrAction(token, { reservation_id: Number(reservationId), action });
    if (result.status !== 'success') return setError(result.message || 'QR action failed.');
    setMessage(result.message); setManual('');
    const refreshed = await fetchEquipmentReservations(token); setReservations(refreshed.data || []);
  };

  const decode = async (value) => {
    try {
      const data = JSON.parse(value);
      if (data.type !== 'equipment_reservation' || !data.reservation_id) throw new Error();
      await runAction(data.reservation_id);
    } catch { setError('Invalid QR. Use a Smart Campus equipment reservation QR.'); }
  };

  const startScanner = async () => {
    setError('');
    if (!('BarcodeDetector' in window)) return setError('QR camera scanning is not supported by this browser. Use the manual QR payload field instead.');
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play(); setScanning(true);
      const loop = async () => {
        if (!streamRef.current) return;
        try { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) { await decode(codes[0].rawValue); stopScanner(); return; } } catch (_) {}
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch { setError('Camera access was denied or unavailable.'); }
  };

  const stopScanner = () => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setScanning(false); };

  return <div className="module-page">
    <section className="module-heading"><div><p className="eyebrow">QR code system</p><h2>Issue & return equipment</h2><p>Generate a reservation QR for collection, or scan a QR at the equipment desk. Inventory updates automatically on return.</p></div></section>
    {(message || error) && <div className={`alert ${message ? 'profile-success' : ''}`}>{message || error}</div>}
    <div className="grid grid-2">
      <section className="card"><h3>Generate QR</h3><label>Reservation<select value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">Select reservation</option>{reservations.map(r=><option key={r.id} value={r.id}>#{r.id} · {r.equipment_name} × {r.quantity} · {r.status}</option>)}</select></label>{qrImage && <div style={{marginTop:'1rem',textAlign:'center'}}><img src={qrImage} alt="Equipment reservation QR code" width="240" height="240" /><p className="muted">Scan this code at the equipment desk.</p></div>}</section>
      <section className="card"><h3>Scan QR</h3><label>Action<select value={action} onChange={e=>setAction(e.target.value)}><option value="issue">Issue equipment</option><option value="return">Return equipment</option></select></label><video ref={videoRef} style={{width:'100%',marginTop:'1rem',display:scanning?'block':'none'}} muted playsInline /><div style={{display:'flex',gap:'.5rem',marginTop:'1rem'}}>{!scanning ? <button className="button" onClick={startScanner}>Start camera scanner</button> : <button className="button button-secondary" onClick={stopScanner}>Stop scanner</button>}</div><label style={{marginTop:'1rem'}}>Manual QR payload<input value={manual} onChange={e=>setManual(e.target.value)} placeholder='Paste {"type":"equipment_reservation