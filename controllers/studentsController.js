const db = require('../config/db');
const { validateBody, validatePhone, validateInteger } = require('../utils/validators');
const { buildUpdateFields, buildSearchQuery } = require('../utils/dbHelpers');

const listStudents = async (req, res, next) => {
  try {
    const { search, branch, semester, department } = req.query;
    const filters = [];
    const values = [];

    if (search) {
      filters.push('(u.name LIKE ? OR u.email LIKE ? OR s.roll_number LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (branch) {
      filters.push('s.branch = ?');
      values.push(branch);
    }
    if (semester !== undefined) {
      filters.push('s.semester = ?');
      values.push(Number(semester));
    }
    if (department) {
      filters.push('s.department = ?');
      values.push(department);
    }

    const where = buildSearchQuery(filters);
    const [students] = await db.promise().query(
      `SELECT s.id, u.id AS user_id, u.name, u.email, u.phone, s.roll_number, s.branch, s.semester, s.department, s.enrollment_year, s.date_of_birth, s.created_at, s.updated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       ${where}
       ORDER BY s.created_at DESC`,
      values
    );

    res.json({ status: 'success', data: students });
  } catch (error) {
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[student]] = await db.promise().query(
      `SELECT s.id, u.id AS user_id, u.name, u.email, u.phone, s.roll_number, s.branch, s.semester, s.department, s.enrollment_year, s.date_of_birth, s.created_at, s.updated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    res.json({ status: 'success', data: student });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { user_id, roll_number, branch, semester, department, enrollment_year, date_of_birth, phone } = req.body;
    const errors = validateBody(['user_id'], req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    }

    if (phone !== undefined && phone !== null && phone !== '' && !validatePhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Phone must be a valid number format.' });
    }
    if (semester !== undefined && semester !== null && semester !== '' && !validateInteger(semester, { min: 1, max: 12 })) {
      return res.status(400).json({ status: 'error', message: 'Semester must be a number between 1 and 12' });
    }

    const [[user]] = await db.promise().query(`SELECT id FROM users WHERE id = ?`, [user_id]);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const [[existingStudent]] = await db.promise().query(`SELECT id FROM students WHERE user_id = ?`, [user_id]);
    if (existingStudent) {
      return res.status(409).json({ status: 'error', message: 'Student profile already exists for this user' });
    }

    const [result] = await db.promise().query(
      `INSERT INTO students (user_id, roll_number, branch, semester, department, enrollment_year, date_of_birth)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, roll_number || null, branch || null, semester === undefined || semester === '' ? null : Number(semester), department || null, enrollment_year || null, date_of_birth || null]
    );

    const [[student]] = await db.promise().query(
      `SELECT s.id, u.id AS user_id, u.name, u.email, u.phone, s.roll_number, s.branch, s.semester, s.department, s.enrollment_year, s.date_of_birth, s.created_at, s.updated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: student });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No student data provided for update' });
    }

    if (updates.phone !== undefined && updates.phone !== null && updates.phone !== '' && !validatePhone(updates.phone)) {
      return res.status(400).json({ status: 'error', message: 'Phone must be a valid number format.' });
    }
    if (updates.semester !== undefined && updates.semester !== null && updates.semester !== '' && !validateInteger(updates.semester, { min: 1, max: 12 })) {
      return res.status(400).json({ status: 'error', message: 'Semester must be a number between 1 and 12' });
    }

    const [[student]] = await db.promise().query(`SELECT id FROM students WHERE id = ?`, [id]);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const allowedFields = ['roll_number', 'branch', 'semester', 'department', 'enrollment_year', 'date_of_birth'];
    const { fields, values } = buildUpdateFields(updates, allowedFields);
    if (!fields.length && updates.phone === undefined) {
      return res.status(400).json({ status: 'error', message: 'No valid student updates provided' });
    }

    const normalizedValues = values.map((value, index) => {
      const field = fields[index].split(' = ')[0];
      if (field === 'semester') {
        return value === '' || value === null ? null : Number(value);
      }
      return value === undefined ? null : value;
    });

    const fieldsToUpdate = [...fields];
    const valuesToUpdate = [...normalizedValues];
    if (updates.phone !== undefined) {
      fieldsToUpdate.push('phone = ?');
      valuesToUpdate.push(updates.phone ? String(updates.phone).trim() : null);
    }

    if (!fieldsToUpdate.length) {
      return res.status(400).json({ status: 'error', message: 'No valid student updates provided' });
    }

    valuesToUpdate.push(id);
    await db.promise().query(`UPDATE students SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, valuesToUpdate);

    const [[updatedStudent]] = await db.promise().query(
      `SELECT s.id, u.id AS user_id, u.name, u.email, u.phone, s.roll_number, s.branch, s.semester, s.department, s.enrollment_year, s.date_of_birth, s.created_at, s.updated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    res.json({ status: 'success', data: updatedStudent });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[student]] = await db.promise().query(`SELECT id FROM students WHERE id = ?`, [id]);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    await db.promise().query(`DELETE FROM students WHERE id = ?`, [id]);
    res.json({ status: 'success', message: 'Student record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listStudents, getStudent, createStudent, updateStudent, deleteStudent };