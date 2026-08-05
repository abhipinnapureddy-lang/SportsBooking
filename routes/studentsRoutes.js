const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { listStudents, getStudent, createStudent, updateStudent, deleteStudent } = require('../controllers/studentsController');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('admin'), listStudents);
router.get('/:id', authenticate, authorizeRoles('admin'), getStudent);
router.post('/', authenticate, authorizeRoles('admin'), createStudent);
router.put('/:id', authenticate, authorizeRoles('admin'), updateStudent);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteStudent);

module.exports = router;
