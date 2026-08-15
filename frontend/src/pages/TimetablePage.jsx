import { useEffect, useMemo, useState } from 'react';
import { fetchTimetable } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_START = '06:00:00';
const WEEK_END = '22:00:00';

const toMinutes = (value) => {
  if (!value) return 0;
  const [hours, minutes] = String(value).slice(0, 8).split(':').map(Number);
  return (hours * 60) + minutes;
};

const formatTime = (value) => {
  const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

function TimetablePage() {
  const { token } = useAuth();
  const [timetable, setTimetable] = useState({ grouped: {}, free_periods: {}, events: [] });
  const todayIndex = new Date().getDay();
  const defaultDay = todayIndex === 0 ? 'Sunday' : dayOrder[todayIndex - 1];
  const [selectedDay, setSelectedDay] = useState(defaultDay);
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

  const currentEvents = timetable.grouped[selectedDay] || [];
  const currentFree = timetable.free_periods[selectedDay] || [];

  const blocks = useMemo(() => {
    const busy = currentEvents.map((event) => ({
      type: 'busy',
      start_time: event.start_time,
      end_time: event.end_time,
      title: event.subject || event.title || 'Class',
      location: event.location || ''
    }));

    const free = currentFree.map((slot) => ({
      type: 'free',
      start_time: slot.start_time,
      end_time: slot.end_time,
      title: 'FREE — Available for booking',
      location: ''
    }));

    return [...busy, ...free].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  }, [currentEvents, currentFree]);

  const renderBlock = (block, index) => {
    const duration = Math.max(30, toMinutes(block.end_time) - toMinutes(block.start_time));
    return (
      <div
        key={`${block.type}-${block.start_time}-${index}`}
        className={`timetable-visual-block ${block.type === 'busy' ? 'busy-block' : 'free-block'}`}
        style={{ minHeight: `${Math.max(76, duration * 1.05)}px` }}
      >
        <div className="timetable-block-time">
          {formatTime(block.start_time)} — {formatTime(block.end_time)}
        </div>
        <div className="timetable-block-title">{block.title}</div>
        {block.location && <div className="timetable-block-location">{block.location}</div>}
        <div className="timetable-block-status">
          {block.type === 'busy' ? '🔴 CLASS / BUSY' : '🟢 FREE / BOOKABLE'}
        </div>
      </div>
    );
  };

  return (
    <div className="module-page">
      <section className="module-heading">
        <div>
          <p className="eyebrow">Timetable integration</p>
          <h2>My Class Timetable</h2>
          <p>Green blocks are free; red blocks are class hours. Free periods can be used for sports booking.</p>
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
                    <small>{freeCount} free · {busyCount} classes</small>
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
                <p>{currentEvents.length} class period(s) · {currentFree.length} free period(s)</p>
              </div>
              <div className="timetable-legend">
                <span className="legend-item"><i className="legend-dot legend-red" /> Class / Busy</span>
                <span className="legend-item"><i className="legend-dot legend-green" /> Free / Bookable</span>
              </div>
            </div>

            <section className="card timetable-card timetable-visual-card">
              <div className="timetable-scale">
                <span>{formatTime(WEEK_START)}</span>
                <span>{formatTime(WEEK_END)}</span>
              </div>
              <div className="timetable-visual-list">
                {blocks.length ? blocks.map(renderBlock) : (
                  <div className="timetable-empty">No timetable data available for {selectedDay}.</div>
                )}
              </div>
            </section>

            <section className="card timetable-card">
              <h3>Class schedule</h3>
              {currentEvents.length ? currentEvents.map((event) => (
                <div key={event.id} className="timetable-item timetable-busy">
                  <div>
                    <strong>{event.subject || event.title}</strong>
                    {event.location && <p>{event.location}</p>}
                  </div>
                  <div><span>{formatTime(event.start_time)} — {formatTime(event.end_time)}</span></div>
                </div>
              )) : <p className="muted">No classes scheduled on this day.</p>}
            </section>

            <section className="card timetable-card">
              <h3>Free periods</h3>
              {currentFree.length ? currentFree.map((freeSlot, index) => (
                <div key={index} className="timetable-item timetable-free">
                  <div><strong>Free — available for sports booking</strong></div>
                  <div><span>{formatTime(freeSlot.start_time)} — {formatTime(freeSlot.end_time)}</span></div>
                </div>
              )) : <p className="muted">No free slots detected on this day.</p>}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default TimetablePage;
