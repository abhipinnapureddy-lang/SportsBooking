const db = require('../config/db');

const normalize = (value = '') => String(value).toLowerCase().trim();

const answerSportsQuestion = (question) => {
  const q = normalize(question);
  const knowledge = [
    { keys: ['cricket', 'rules'], answer: 'Cricket is played between two teams. Common campus formats use limited overs; focus on fair play, safe equipment, and the ground rules posted by your coordinator.' },
    { keys: ['football', 'rules'], answer: 'Football is played by two teams trying to score goals. Follow the campus ground rules, wear suitable footwear, and warm up before play.' },
    { keys: ['badminton', 'rules'], answer: 'Badminton uses a racket and shuttlecock. Keep rallies within the marked court and check the court availability before booking.' },
    { keys: ['basketball', 'rules'], answer: 'Basketball is played by two teams attempting to score through the hoop. Use the campus court rules and respect the scheduled slot.' },
    { keys: ['fitness', 'exercise', 'practice'], answer: 'For general fitness, combine warm-up, sport-specific practice, strength work, mobility and recovery. Start at a comfortable intensity.' }
  ];
  const hit = knowledge.find(item => item.keys.some(key => q.includes(key)));
  return hit?.answer || 'I can help with sports recommendations, equipment, free-slot planning, bookings, and basic sports guidance. Try asking “Which sport should I try?”, “What equipment do I need for badminton?”, or “Find a free slot”.';
};

const recommendSport = async (question) => {
  const q = normalize(question);
  const [sports] = await db.promise().query(`SELECT id, name, description FROM sports ORDER BY name`);
  if (!sports.length) return { recommendation: 'No sports are configured yet.', sports: [] };

  const preferred = sports.filter(s => q.includes(normalize(s.name)));
  if (preferred.length) return { recommendation: `${preferred[0].name} matches the sport you mentioned.`, sports: preferred.slice(0, 3) };

  const keywords = q.includes('team') || q.includes('group') ? ['Cricket', 'Football', 'Volleyball', 'Basketball'] : ['Badminton', 'Table Tennis', 'Basketball', 'Football'];
  const ranked = [...sports].sort((a, b) => keywords.indexOf(a.name) - keywords.indexOf(b.name));
  return { recommendation: `Based on your request, I recommend ${ranked[0]?.name || sports[0].name}. You can compare the other available sports below.`, sports: ranked.slice(0, 4) };
};

const equipmentRecommendation = async (question) => {
  const q = normalize(question);
  const [items] = await db.promise().query(`SELECT id, name, category, available_quantity, item_condition FROM equipment ORDER BY available_quantity DESC`);
  const sportMap = {
    badminton: ['racket', 'shuttle'], cricket: ['cricket', 'bat', 'ball'], football: ['football', 'ball'], basketball: ['basketball', 'ball'], volleyball: ['volleyball', 'ball'], kabaddi: ['kabaddi'], 'table tennis': ['table', 'racket'], chess: ['chess'], carrom: ['carrom'], athletics: ['athletics']
  };
  const matches = Object.entries(sportMap).filter(([sport]) => q.includes(sport)).flatMap(([, terms]) => items.filter(item => terms.some(t => normalize(item.name).includes(t) || normalize(item.category).includes(t))));
  const result = (matches.length ? matches : items).slice(0, 6);
  return { recommendation: result.length ? 'These are the most relevant available equipment items.' : 'No equipment is currently configured.', equipment: result };
};

const freeSlots = async () => {
  const [rows] = await db.promise().query(`
    SELECT s.id, s.start_time, s.end_time, s.status, g.name AS ground_name, COALESCE(sp.name, g.name) AS sport_name
    FROM slots s JOIN grounds g ON g.id = s.ground_id
    LEFT JOIN sports sp ON sp.id = g.sport_id
    WHERE s.status = 'available' AND s.start_time >= NOW()
    ORDER BY s.start_time ASC LIMIT 12
  `);
  return { recommendation: rows.length ? 'Here are the next free campus slots.' : 'There are no future free slots currently available.', slots: rows };
};

const assistant = async (req, res, next) => {
  try {
    const question = String(req.body.question || '').trim();
    if (!question) return res.status(400).json({ status: 'error', message: 'Ask the assistant a question.' });
    const q = normalize(question);
    let result;
    if (q.includes('free slot') || q.includes('available slot') || q.includes('free time')) result = await freeSlots();
    else if (q.includes('equipment') || q.includes('gear') || q.includes('kit')) result = await equipmentRecommendation(question);
    else if (q.includes('recommend') || q.includes('which sport') || q.includes('sport for me')) result = await recommendSport(question);
    else result = { recommendation: answerSportsQuestion(question) };
    res.json({ status: 'success', data: result });
  } catch (error) { next(error); }
};

module.exports = { assistant };
