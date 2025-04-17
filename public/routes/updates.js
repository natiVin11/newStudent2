const express = require('express');
const router = express.Router();
const db = require('../database/database');

// קבלת כל העדכונים
router.get('/', async (req, res) => {
  try {
    const updates = await db.all('SELECT * FROM updates ORDER BY date DESC');
    res.json(updates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

module.exports = router;