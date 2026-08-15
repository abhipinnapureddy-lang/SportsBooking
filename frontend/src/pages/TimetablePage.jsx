import { useEffect, useState } from 'react';
import { fetchTimetable } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TimetablePage() {
  const { token } = useAuth();
  const [timetable, setTimetable] = useState({ grouped: {}, free_periods: {}, events: [] });
  const [selectedDay, setSelectedDay] = useState(dayOrder[new Date().getDay() - 1] || 'Monday');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        setError('Please log in to view your timetable.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetchTimetable(token);
        if (response.status !== 'success') {
          setError(response.message || 'Unable to load timetable.');
          return;
        }
        setError('');
        setTimetable(response.data || { grouped: {}, free_periods: {}, events: [] });
      } catch (_) {
        setError('Unable to load timetable.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const renderEvent = (event) => (
    <div key={event.id} className="timetable-item timetable-busy">
      <div>
        <strong>{event.subject || event.title}</strong>
        <p>{event.location}</p>
      </div>
      <div>
        <span>{event.start_time} — {event.end_time}</span>
      </div>
    </div>
  );

  const renderFree = (freeSlot, index) => (
    <div key={index} className="timetable-item timetable-free">
      <div>
        <strong>Free slot</strong>
      </div>
      <div>
        <span>{freeSlot.start_time} — {freeSlot.end_time}</span>
      </div>
    </div>
  );

  const currentEvents = timetable.grouped[selectedDay] || [];
  const currentFree = timetable.free_periods[selectedDay] || [];

  return (
    <div className="module-page">
      <section className="module-heading">
        <div>
          <p className="eyebrow">Timetable integration</p>
          <h2>Weekly and daily booking availability</h2>
          <p>Review your class schedule and see free periods for booking sports slots.</p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card">Loading timetable…</div>
      ) : (
        <div className="timetable-shell">
          <aside className="timetable-sidebar">
            <h3>Weekly view</h3>
            <div className="day-list">
              {dayOrder.map((day) => {
                const freeCount = (timetable.free_periods[day] || []).length;
                const busyCount = (timetable.grouped[day] || []).length;
                return (
                  <button
                    key={day}
                    type="button"
                    className={`day-pill ${selectedDay === day ? 'active' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span>{day}</span>
                    <small>{freeCount} free · {busyCount} busy</small>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="timetable-main">
            <div className="timetable-header">
              <div>
                <p className="eyebrow">Daily view</p>
                <h2>{selectedDay}</h2>
                <p>Green blocks are free; red blocks are class hours.</p>
              </div>
            </div>

            <section className="card timetable-card">
              <h3>Class schedule</h3>
              {currentEvents.length ? currentEvents.map(renderEvent) : <p className="muted">No classes scheduled on this day.</p>}
            </section>

            <section className="card timetable-card">
              <h3>Free periods</h3>
              {currentFree.length ? currentFree.map(renderFree) : <p className="muted">No free slots detected on this day.</p>}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default TimetablePage;
