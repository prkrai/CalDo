const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/events?month=2026-06 - events for a given month, or all if no filter
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM events';
    const params = [];

    if (month) {
      query += ' WHERE DATE_FORMAT(event_date, "%Y-%m") = ?';
      params.push(month);
    }
    query += ' ORDER BY event_date ASC, event_time ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events - create an event
router.post('/', async (req, res) => {
  try {
    const { title, event_date, event_time, notes } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ error: 'title and event_date are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO events (title, event_date, event_time, notes) VALUES (?, ?, ?, ?)',
      [title, event_date, event_time || null, notes || null]
    );

    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
