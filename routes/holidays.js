const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/holidays/:year - public holidays for a year, defaulting to ?country=IN
// Pulls from the Calendarific API (https://calendarific.com), which has
// actual India holiday coverage (Nager.Date, our original choice, does not).
// Caches results in MySQL so we're not re-fetching the same year/country
// on every calendar load and don't burn through the free-tier rate limit.
router.get('/:year', async (req, res) => {
  const { year } = req.params;
  const country = (req.query.country || process.env.DEFAULT_COUNTRY_CODE || 'IN').toUpperCase();
  const apiKey = process.env.CALENDARIFIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'CALENDARIFIC_API_KEY is not set in .env' });
  }

  try {
    // 1. Check cache first
    const [cached] = await pool.query(
      'SELECT payload FROM holiday_cache WHERE country_code = ? AND year = ?',
      [country, year]
    );

    if (cached.length > 0) {
      const payload = cached[0].payload;
      // mysql2 auto-deserializes MySQL's JSON column type into a JS object,
      // so payload may already be an object rather than a JSON string.
      return res.json(typeof payload === 'string' ? JSON.parse(payload) : payload);
    }
    // 2. Cache miss -> fetch from third-party REST API
    const apiUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${country}&year=${year}&type=national`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Holiday API responded with status ${response.status}`);
    }

    const rawText = await response.text();
    const data = rawText.trim().length > 0 ? JSON.parse(rawText) : null;

    if (!data || data.meta?.code !== 200) {
      throw new Error(data?.meta?.error_detail || 'Unexpected response from holiday API');
    }

    // Normalize Calendarific's shape down to { date, localName } so the
    // frontend (originally written for Nager.Date) doesn't need changes.
    const holidays = (data.response?.holidays || []).map((h) => ({
      date: h.date?.iso?.slice(0, 10),
      localName: h.name,
      name: h.name,
    }));

    // 3. Store in cache for next time
    await pool.query(
      `INSERT INTO holiday_cache (country_code, year, payload) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = ?, fetched_at = CURRENT_TIMESTAMP`,
      [country, year, JSON.stringify(holidays), JSON.stringify(holidays)]
    );

    res.json(holidays);
  } catch (err) {
    res.status(502).json({ error: 'Could not fetch holiday data', details: err.message });
  }
});

module.exports = router;