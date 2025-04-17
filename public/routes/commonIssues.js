const express = require('express');
const router = express.Router();
const db = require('../database/database');

// קבלת תקלות נפוצות (אפשר להוסיף פילטור לפי שאילתה)
router.get('/', async (req, res) => {
  const { query } = req.query;
  let sql = 'SELECT * FROM common_issues';
  const params = [];

  if (query) {
    sql += ' WHERE title LIKE ? OR solution LIKE ?';
    params.push(`%${query}%`, `%${query}%`);
  }

  try {
    const issues = await db.all(sql, params);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching common issues:', error);
    res.status(500).json({ error: 'Failed to fetch common issues' });
  }
});

// הוספת תקלה נפוצה (דורש אימות מנהל)
router.post('/', async (req, res) => {
  const { title, solution } = req.body;
  try {
    const result = await db.runQuery('INSERT INTO common_issues (title, solution) VALUES (?, ?)', [title, solution]);
    res.status(201).json({ id: result.id, message: 'Common issue added successfully' });
  } catch (error) {
    console.error('Error adding common issue:', error);
    res.status(500).json({ error: 'Failed to add common issue' });
  }
});

// עדכון תקלה נפוצה (דורש אימות מנהל)
router.put('/:id', async (req, res) => {
  const { title, solution } = req.body;
  const { id } = req.params;
  try {
    const result = await db.runQuery('UPDATE common_issues SET title = ?, solution = ? WHERE id = ?', [title, solution, id]);
    if (result.changes > 0) {
      res.json({ message: 'Common issue updated successfully' });
    } else {
      res.status(404).json({ error: 'Common issue not found' });
    }
  } catch (error) {
    console.error('Error updating common issue:', error);
    res.status(500).json({ error: 'Failed to update common issue' });
  }
});

// מחיקת תקלה נפוצה (דורש אימות מנהל)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.runQuery('DELETE FROM common_issues WHERE id = ?', [id]);
    if (result.changes > 0) {
      res.json({ message: 'Common issue deleted successfully' });
    } else {
      res.status(404).json({ error: 'Common issue not found' });
    }
  } catch (error) {
    console.error('Error deleting common issue:', error);
    res.status(500).json({ error: 'Failed to delete common issue' });
  }
});

module.exports = router;