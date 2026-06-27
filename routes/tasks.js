const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/tasks - list all tasks, optionally filter by status
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tasks';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY due_date ASC, priority DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id - single task
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - create a task
router.post('/', async (req, res) => {
  try {
    const { title, description, due_date, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, due_date, priority) VALUES (?, ?, ?, ?)',
      [title, description || null, due_date || null, priority || 'medium']
    );

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id - update a task (e.g. mark complete, edit fields)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, due_date, status, priority } = req.body;
    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Task not found' });

    const current = existing[0];
    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, due_date = ?, status = ?, priority = ?
       WHERE id = ?`,
      [
        title ?? current.title,
        description ?? current.description,
        due_date ?? current.due_date,
        status ?? current.status,
        priority ?? current.priority,
        req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
