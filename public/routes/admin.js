const express = require('express');
const router = express.Router();
const db = require('../database/database');

// קבלת תוצאות שאלונים (דורש אימות מנהל)
router.get('/quiz_results', async (req, res) => {
  try {
    const results = await db.all('SELECT * FROM quiz_results ORDER BY submission_date DESC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// יצירת סיסמה רנדומלית (דורש אימות מנהל)
router.post('/generate_password', async (req, res) => {
  const { username } = req.body;
  // כאן תצטרך לגשת למערכת ניהול המשתמשים האמיתית שלך
  // במקום ליצור סיסמה רנדומלית בלבד.
  // לצורך הדוגמה:
  const newPassword = Math.random().toString(36).slice(-8);
  console.log(`Generated password for ${username}: ${newPassword}`);
  res.json({ password: newPassword });
});

// קבלת משוב מהמשתמשים
router.post('/submit_feedback', async (req, res) => {
  const { message } = req.body;
  try {
    const result = await db.runQuery('INSERT INTO admin_feedback (message) VALUES (?)', [message]);
    res.status(201).json({ id: result.id, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// קבלת נתוני התקדמות סטודנטים (למנהל)
router.get('/student_progress', async (req, res) => {
  try {
    const progressData = await db.all('SELECT * FROM student_progress ORDER BY registration_date DESC');
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching student progress data for admin:', error);
    res.status(500).json({ error: 'Failed to fetch student progress data' });
  }
});

module.exports = router;