const db = require('../config/db');

const listTournaments = async (req, res, next) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT t.*, s.name AS sport_name,
        (SELECT COUNT(*) FROM tournament_teams tt WHERE tt.tournament_id = t.id) AS team_count
      FROM tournaments t
      JOIN sports s ON s.id = t.sport_id
      ORDER BY t.start_date ASC, t.created_at DESC
    `);
    res.json({ status: 'success', data: rows });
  } catch (error) { next(error); }
};

const getTournament = async (req, res, next) => {
  try {
    const [[tournament]] = await db.promise().query(`
      SELECT t.*, s.name AS sport_name
      FROM tournaments t JOIN sports s ON s.id = t.sport_id WHERE t.id = ?
    `, [req.params.id]);
    if (!tournament) return res.status(404).json({ status: 'error', message: 'Tournament not found.' });
    const [teams] = await db.promise().query(`SELECT id, name, captain_id, status, created_at FROM tournament_teams WHERE tournament_id = ? ORDER BY name`, [req.params.id]);
    const [matches] = await db.promise().query(`
      SELECT m.*, a.name AS team_a_name, b.name AS team_b_name, w.name AS winner_name
      FROM tournament_matches m
      JOIN tournament_teams a ON a.id = m.team_a_id
      JOIN tournament_teams b ON b.id = m.team_b_id
      LEFT JOIN tournament_teams w ON w.id = m.winner_team_id
      WHERE m.tournament_id = ? ORDER BY m.scheduled_at ASC, m.id ASC
    `, [req.params.id]);
    res.json({ status: 'success', data: { tournament, teams, matches } });
  } catch (error) { next(error); }
};

const createTournament = async (req, res, next) => {
  try {
    const { name, sport_id, description, start_date, end_date } = req.body;
    if (!name || !sport_id || !start_date || !end_date || new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ status: 'error', message: 'Enter a valid tournament name, sport and date range.' });
    }
    const [result] = await db.promise().query(`
      INSERT INTO tournaments (name, sport_id, description, start_date, end_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, 'registration', ?)
    `, [name.trim(), sport_id, description || null, start_date, end_date, req.user.id]);
    res.status(201).json({ status: 'success', data: { id: result.insertId }, message: 'Tournament created.' });
  } catch (error) { next(error); }
};

const registerTeam = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Team name is required.' });
    const [[tournament]] = await db.promise().query(`SELECT id, status FROM tournaments WHERE id = ?`, [req.params.id]);
    if (!tournament) return res.status(404).json({ status: 'error', message: 'Tournament not found.' });
    if (!['registration', 'upcoming'].includes(tournament.status)) return res.status(400).json({ status: 'error', message: 'Team registration is closed.' });
    const [result] = await db.promise().query(`INSERT INTO tournament_teams (tournament_id, name, captain_id) VALUES (?, ?, ?)`, [req.params.id, name.trim(), req.user.id]);
    await db.promise().query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Tournament registration', ?, 'success')`, [req.user.id, `Team ${name.trim()} registered successfully.`]);
    res.status(201).json({ status: 'success', data: { id: result.insertId }, message: 'Team registered.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ status: 'error', message: 'That team name is already registered.' });
    next(error);
  }
};

const createMatch = async (req, res, next) => {
  try {
    const { team_a_id, team_b_id, scheduled_at, venue } = req.body;
    if (!team_a_id || !team_b_id || Number(team_a_id) === Number(team_b_id)) return res.status(400).json({ status: 'error', message: 'Choose two different teams.' });
    const [result] = await db.promise().query(`INSERT INTO tournament_matches (tournament_id, team_a_id, team_b_id, scheduled_at, venue) VALUES (?, ?, ?, ?, ?)`, [req.params.id, team_a_id, team_b_id, scheduled_at || null, venue || null]);
    res.status(201).json({ status: 'success', data: { id: result.insertId }, message: 'Fixture created.' });
  } catch (error) { next(error); }
};

const updateMatch = async (req, res, next) => {
  try {
    const { score_a, score_b, status, winner_team_id } = req.body;
    const allowed = ['scheduled', 'live', 'completed', 'cancelled'];
    if (status && !allowed.includes(status)) return res.status(400).json({ status: 'error', message: 'Invalid match status.' });
    await db.promise().query(`UPDATE tournament_matches SET score_a = COALESCE(?, score_a), score_b = COALESCE(?, score_b), status = COALESCE(?, status), winner_team_id = ? WHERE id = ?`, [score_a ?? null, score_b ?? null, status || null, winner_team_id || null, req.params.matchId]);
    res.json({ status: 'success', message: 'Fixture result updated.' });
  } catch (error) { next(error); }
};

module.exports = { listTournaments, getTournament, createTournament, registerTeam, createMatch, updateMatch };
