require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const taskRoutes = require('./routes/tasks');
const eventRoutes = require('./routes/events');
const holidayRoutes = require('./routes/holidays');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/holidays', holidayRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CALdo server running on http://localhost:${PORT}`);
});
