const express = require('express');
const router = express.Router();
const db = require('../database/database');

// קבלת כל הלומדות
router.get('/', async (req, res) => {
  try {
    const materials = await db.all('SELECT * FROM learning_materials');
    res.json(materials);
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// הוספת לומדה (דורש אימות מנהל)
router.post('/', async (req, res) => {
  const { name, content, imageUrl } = req.body;
  try {
    const result = await db.runQuery('INSERT INTO learning_materials (name, content, image_url) VALUES (?, ?, ?)', [name, content, imageUrl]);
    res.status(201).json({ id: result.id, message: 'Learning material added successfully' });
  } catch (error) {
    console.error('Error adding learning material:', error);
    res.status(500).json({ error: 'Failed to add learning material' });
  }
});

// עדכון לומדה (דורש אימות מנהל)
router.put('/:id', async (req, res) => {
  const { name, content, imageUrl } = req.body;
  const { id } = req.params;
  try {
    const result = await db.runQuery('UPDATE learning_materials SET name = ?, content = ?, image_url = ? WHERE id = ?', [name, content, imageUrl, id]);
    if (result.changes > 0) {
      res.json({ message: 'Learning material updated successfully' });
    } else {
      res.status(404).json({ error: 'Learning material not found' });
    }
  } catch (error) {
    console.error('Error updating learning material:', error);
    res.status(500).json({ error: 'Failed to update learning material' });
  }
});

// מחיקת לומדה (דורש אימות מנהל)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.runQuery('DELETE FROM learning_materials WHERE id = ?', [id]);
    if (result.changes > 0) {
      res.json({ message: 'Learning material deleted successfully' });
    } else {
      res.status(404).json({ error: 'Learning material not found' });
    }
  } catch (error) {
    console.error('Error deleting learning material:', error);
    res.status(500).json({ error: 'Failed to delete learning material' });
  }
});

module.exports = router;