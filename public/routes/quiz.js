const express = require('express');
const router = express.Router();
const db = require('../database/database');

// קבלת כל השאלות לשאלון
router.get('/questions', async (req, res) => {
  try {
    const questions = await db.all('SELECT id, question_text, options FROM quiz_questions');
    // אל תשלח את התשובה הנכונה לסטודנט!
    res.json(questions.map(q => ({ ...q, options: JSON.parse(q.options) })));
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// שמירת תוצאות שאלון
router.post('/results', async (req, res) => {
  const { score, studentId } = req.body; // תצטרך לדעת איזה סטודנט ענה
  try {
    const result = await db.runQuery('INSERT INTO quiz_results (student_id, score) VALUES (?, ?)', [studentId, score]);
    res.status(201).json({ id: result.id, message: 'Quiz results submitted successfully' });
  } catch (error) {
    console.error('Error submitting quiz results:', error);
    res.status(500).json({ error: 'Failed to submit quiz results' });
  }
});

// הוספת שאלת שאלון (דורש אימות מנהל)
router.post('/questions', async (req, res) => {
  const { questionText, correctAnswer, options } = req.body;
  try {
    const result = await db.runQuery(
      'INSERT INTO quiz_questions (question_text, correct_answer, options) VALUES (?, ?, ?)',
      [questionText, correctAnswer, JSON.stringify(options)]
    );
    res.status(201).json({ id: result.id, message: 'Quiz question added successfully' });
  } catch (error) {
    console.error('Error adding quiz question:', error);
    res.status(500).json({ error: 'Failed to add quiz question' });
  }
});

// קבלת כל השאלות והתשובות (למנהל)
router.get('/admin/questions', async (req, res) => {
  try {
    const questions = await db.all('SELECT * FROM quiz_questions');
    res.json(questions.map(q => ({ ...q, options: JSON.parse(q.options) })));
  } catch (error) {
    console.error('Error fetching quiz questions for admin:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

module.exports = router;