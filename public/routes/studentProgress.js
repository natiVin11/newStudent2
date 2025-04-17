const express = require('express');
const router = express.Router();
const db = require('../database/database');
const multer = require('multer'); // לטיפול בהעלאת קבצים
const path = require('path');
//const pdfMake = require('pdfmake/build/pdfmake');
//const pdfFonts = require('pdfmake/build/vfs_fonts');
//pdfMake.vfs = pdfFonts.pdfMake.vfs;

// הגדרת אחסון קבצים (יש להתאים את הנתיב)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // תיקייה להעלאת מסמכים
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// קבלת התקדמות סטודנט לפי שם (לסטודנט)
router.get('/', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  try {
    const progress = await db.get('SELECT * FROM student_progress WHERE full_name = ?', [name]);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
});

// הוספת פרטי סטודנט חדש
router.post('/', async (req, res) => {
  const { fullName, phone, email, idCard, address, securityQuestion, securityAnswer } = req.body;
  try {
    const result = await db.runQuery(
        'INSERT INTO student_progress (full_name, phone, email, id_card, address, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [fullName, phone, email, idCard, address, securityQuestion, securityAnswer]
    );
    res.status(201).json({ id: result.id, message: 'Student details submitted successfully' });
  } catch (error) {
    console.error('Error submitting student details:', error);
    res.status(500).json({ error: 'Failed to submit student details' });
  }
});

// העלאת מסמך משאבי אנוש
router.post('/upload_document', upload.single('document'), async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  const documentPath = `/uploads/${req.file.filename}`; // שמור נתיב יחסי      // תצטרך דרך לזהות את הסטודנט שאליו המסמך שייך (אולי באמצעות טוקן או פרמטר אחר)
      // לצורך הדוגמה, נניח שאתה מקבל איזשהו מזהה סטודנט
      const studentId = req.body.studentId; // קבלת מזהה סטודנט מגוף הבקשה

      if (!studentId) {
        // אם אין מזהה סטודנט, תחזיר שגיאה
        // במערכת אמיתית תצטרך לנהל את זה בצורה מאובטחת יותר
        return res.status(400).json({ error: 'Student ID is required for document upload' });
      }

      try {
        const result = await db.runQuery(
            'UPDATE student_progress SET document_path = ? WHERE id = ?',
            [documentPath, studentId]
        );
        if (result.changes > 0) {
          res.json({ message: 'Document uploaded successfully', path: documentPath });
        } else {
          res.status(404).json({ error: 'Student not found' });
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
      }
    }
);

// עדכון סטטוס התקדמות סטודנט
router.put('/:id', async (req, res) => {
  const { current_stage } = req.body;
  const { id } = req.params;
  try {
    const result = await db.runQuery(
        'UPDATE student_progress SET current_stage = ? WHERE id = ?',
        [current_stage, id]
    );
    if (result.changes > 0) {
      res.json({ message: 'Student progress updated successfully' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (error) {
    console.error('Error updating student progress:', error);
    res.status(500).json({ error: 'Failed to update student progress' });
  }
});

module.exports = router;