// --- Dependencies ---
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sqlite3 = require('sqlite3').verbose();

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3012;
const dbFile = path.join(__dirname, "app_data.db");
const uploadsDir = path.join(__dirname, "uploads");
const publicDir = path.join(__dirname, "public"); // נתיב לתיקייה הציבורית

// --- Database Setup ---
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error("Fatal Error: Could not connect to database.", err.message);
        process.exit(1);
    } else {
        console.log("Successfully connected to the SQLite database:", dbFile);
        initializeDatabase();
    }
});

function initializeDatabase() {
    console.log("Initializing database tables...");
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'questions' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            wrong_answers TEXT,
            date TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'quiz_results' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue TEXT NOT NULL,
            solution TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'issues' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'lessons' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            date TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'updates' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS malfunctions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            malfunction TEXT NOT NULL,
            fix TEXT NOT NULL,
            date TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'malfunctions' table:", err.message); });

        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            id_number TEXT NOT NULL UNIQUE,
            email TEXT,
            phone TEXT,
            department TEXT,
            file_path TEXT,
            step INTEGER DEFAULT 1,
            progress_date TEXT,
            birthDate TEXT,
            securityQuestion TEXT,
            answer TEXT,
            address TEXT
        )`, (err) => {
            if (err) console.error("Error creating 'students' table:", err.message);
            else {
                db.run(`CREATE INDEX IF NOT EXISTS idx_student_id_number ON students (id_number)`, (errIdx) => {
                    if (errIdx) console.error("Error creating index on students(id_number):", errIdx.message);
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS checklists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            checked BOOLEAN DEFAULT 0,
            date_added TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating 'checklists' table:", err.message); });

        console.log("Database table initialization process completed.");
    });
}
// --- End Database Setup ---

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir)); // הגשת קבצים סטטיים מהתיקייה הציבורית
app.use("/uploads", express.static(uploadsDir));

if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`Created uploads directory: ${uploadsDir}`);
    } catch (err) {
        console.error(`Error creating uploads directory ${uploadsDir}:`, err);
        // אם לא הצלחנו ליצור את תיקיית ההעלאות, כדאי לעצור את השרת
        process.exit(1);
    }
}
// --- End Middleware ---

// --- File Upload (Multer) Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { idNumber } = req.body;
        // תיקון הנתיב - הסרת תגי HTML מיותרים
        const studentDir = path.join(uploadsDir, `<span class="math-inline">\{idNumber\}\_</span>{(req.body.name || "student").replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`);
        fs.mkdir(studentDir, { recursive: true }, (err) => cb(err, studentDir));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `humanResourcesForm${ext}`);
    },
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });
// --- End File Upload Configuration ---


// --- API Routes ---

// Root Route
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "home.html")));

// --- Questions API (שאלונים לסטודנט) ---
app.get("/api/questions", (req, res) => {
    console.log("GET /api/questions - Request received");
    db.all("SELECT id, question, answer FROM questions ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/questions:", err.message);
            return res.status(500).json({ error: "Database error fetching questions" });
        }
        console.log("GET /api/questions - Successfully fetched", rows.length, "questions");
        res.json(rows);
    });
});

app.post("/api/questions", (req, res) => {
    console.log("POST /api/questions - Request body:", req.body);
    const { question, answer } = req.body;
    if (!question || !answer) {
        console.warn("POST /api/questions - Missing question or answer");
        return res.status(400).json({ error: "Question and answer required" });
    }
    db.run("INSERT INTO questions (question, answer) VALUES (?, ?)", [question, answer], function (err) {
        if (err) {
            console.error("API Error POST /api/questions:", err.message);
            return res.status(500).json({ error: "Database error adding question" });
        }
        console.log("POST /api/questions - Question added with ID:", this.lastID);
        res.status(201).json({ message: "Question added", id: this.lastID });
    });
});

app.post("/api/submit-quiz", (req, res) => {
    console.log("POST /api/submit-quiz - Request body:", req.body);
    const { name, answers, questions } = req.body;
    if (!name || !answers || !questions || answers.length !== questions.length) {
        console.warn("POST /api/submit-quiz - Missing data or mismatch in answers/questions");
        return res.status(400).json({ error: "Name, answers, and questions are required and must match in length" });
    }

    let score = 0;
    const wrongAnswers = [];

    for (let i = 0; i < questions.length; i++) {
        if (answers[i] && questions[i] && answers[i].toLowerCase() !== questions[i].answer.toLowerCase()) {
            wrongAnswers.push({ questionId: questions[i].id, userAnswer: answers[i], correctAnswer: questions[i].answer });
        } else if (!questions[i]) {
            console.warn("POST /api/submit-quiz - Question at index", i, "not found in server data");
        }
    }

    const date = new Date().toISOString();
    const wrongAnswersJSON = JSON.stringify(wrongAnswers);

    db.run("INSERT INTO quiz_results (name, score, wrong_answers, date) VALUES (?, ?, ?, ?)", [name, score, wrongAnswersJSON, date], function (err) {
        if (err) {
            console.error("API Error POST /api/submit-quiz:", err.message);
            return res.status(500).json({ error: "Database error saving quiz results" });
        }
        console.log("POST /api/submit-quiz - Quiz results saved for", name, "with score", score);
        res.json({ name: name, score: score, wrongAnswers: wrongAnswers });
    });
});

app.get("/api/quiz-results", (req, res) => {
    console.log("GET /api/quiz-results - Request received");
    db.all("SELECT id, name, score, wrong_answers, date FROM quiz_results ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/quiz-results:", err.message);
            return res.status(500).json({ error: "Database error fetching quiz results" });
        }
        console.log("GET /api/quiz-results - Successfully fetched", rows.length, "results");
        res.json(rows.map(row => ({ ...row, wrongAnswers: row.wrong_answers ? JSON.parse(row.wrong_answers) : [] })));
    });
});

// --- Students API (פרטי הסטודנט) ---
app.get("/api/students/find", (req, res) => {
    const { searchTerm } = req.query;
    console.log("GET /api/students/find - Search term:", searchTerm);
    if (!searchTerm) {
        console.warn("GET /api/students/find - Missing search term");
        return res.status(400).json({ error: 'Search term required.' });
    }
    db.get(`SELECT id, name, id_number, email, phone, department, file_path, step, progress_date, birthDate, securityQuestion, answer, address FROM students WHERE name = ? OR id_number = ?`, [searchTerm, searchTerm], (err, row) => {
        if (err) {
            console.error("API Error GET /api/students/find:", err.message);
            return res.status(500).json({ error: 'Failed to search student.' });
        }
        console.log("GET /api/students/find - Search results:", row);
        res.json(row || { found: false });
    });
});

app.post("/api/students/save", (req, res) => {
    const { name, idNumber, birthDate, securityQuestion, answer, email, address } = req.body;
    console.log("POST /api/students/save - Request body:", req.body);
    if (!name || !idNumber) {
        console.warn("POST /api/students/save - Missing name or ID");
        return res.status(400).json({ error: "Name and ID required" });
    }
    const progressDate = new Date().toISOString();
    const initialStep = 1;
    const sql = `
        INSERT INTO students (name, id_number, email, phone, department, step, progress_date, birthDate, securityQuestion, answer, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id_number) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            phone = excluded.phone,
            department = excluded.department,
            step = excluded.step,
            progress_date = excluded.progress_date,
            birthDate = excluded.birthDate,
            securityQuestion = excluded.securityQuestion,
            answer = excluded.answer,
            address = excluded.address
    `;
    db.run(sql, [name, idNumber, email || null, null, null, initialStep, progressDate, birthDate || null, securityQuestion || null, answer || null, address || null], function (err) {
        if (err) {
            console.error("API Error POST /api/students/save:", err.message);
            return res.status(500).json({ error: "Database error saving/updating student" });
        }
        console.log("POST /api/students/save - Student saved/updated with ID:", idNumber);
        res.status(201).json({ message: "Student saved/updated", step: initialStep });
    });
});

app.post("/api/students/progress", (req, res) => {
    const { idNumber, step } = req.body;
    console.log("POST /api/students/progress - Request body:", req.body);
    if (!idNumber || step === undefined || typeof step !== 'number') {
        console.warn("POST /api/students/progress - Missing ID or invalid step");
        return res.status(400).json({ error: "ID and step required" });
    }
    const progressDate = new Date().toISOString();
    db.run("UPDATE students SET step = ?, progress_date = ? WHERE id_number = ?", [step, progressDate, idNumber], function (err) {
        if (err) {
            console.error("API Error POST /api/students/progress:", err.message);
            return res.status(500).json({ error: "Database error updating progress" });
        }
        console.log("POST /api/students/progress - Progress updated for ID:", idNumber, "to step:", step);
        res.json({ message: "Student progress updated", step: step, changes: this.changes });
    });
});

app.get("/api/students/new-employees", (req, res) => {
    console.log("GET /api/students/new-employees - Request received");
    db.all(`SELECT name, step, file_path, id_number FROM students ORDER BY progress_date DESC`, [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/students/new-employees:", err.message);
            return res.status(500).json({ error: "Database error fetching new employees" });
        }
        console.log("GET /api/students/new-employees - Fetched", rows.length, "new employees");
        res.json(rows.map(emp => ({ ...emp, status: getStatusText(emp.step), pdfFilePath: emp.file_path ? `/uploads/${emp.file_path}` : null })));
    });
});

// --- Issues API (תקלות ופתרונות כלליות) ---
app.get("/api/issues", (req, res) => {
    console.log("GET /api/issues - Request received");
    db.all("SELECT id, issue, solution FROM issues ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/issues:", err.message);
            return res.status(500).json({ error: "Database error fetching issues" });
        }
        console.log("GET /api/issues - Fetched", rows.length, "issues");
        res.json(rows);
    });
});

app.post("/api/issues", (req, res) => {
    console.log("POST /api/issues - Request body:", req.body);
    const { issue, solution }= req.body;
    if (!issue || !solution) {
        console.warn("POST /api/issues - Missing issue or solution");
        return res.status(400).json({ error: "Issue and solution required" });
    }
    db.run("INSERT INTO issues (issue, solution) VALUES (?, ?)", [issue, solution], function (err) {
        if (err) {
            console.error("API Error POST /api/issues:", err.message);
            return res.status(500).json({ error: "Database error adding issue" });
        }
        console.log("POST /api/issues - Issue added with ID:", this.lastID);
        res.status(201).json({ message: "Issue added", id: this.lastID });
    });
});

// --- Malfunctions API (תקלות ספציפיות) ---
app.get("/api/malfunctions", (req, res) => {
    console.log("GET /api/malfunctions - Request received");
    db.all("SELECT id, malfunction, fix, date FROM malfunctions ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/malfunctions:", err.message);
            return res.status(500).json({ error: "Database error fetching malfunctions" });
        }
        console.log("GET /api/malfunctions - Fetched", rows.length, "malfunctions");
        res.json(rows);
    });
});

app.post("/api/malfunctions", (req, res) => {
    console.log("POST /api/malfunctions - Request body:", req.body);
    const { issue, solution } = req.body; // מקבל issue ו-solution מהבקשה
    if (!issue || !solution) {
        console.warn("POST /api/malfunctions - Missing issue or solution for malfunction");
        return res.status(400).json({ error: "Issue and solution required for malfunction" });
    }
    const date = new Date().toISOString();
    db.run("INSERT INTO malfunctions (malfunction, fix, date) VALUES (?, ?, ?)", [issue, solution, date], function (err) { // משתמש ב-malfunction ו-fix בעת הכנסה
        if (err) {
            console.error("API Error POST /api/malfunctions:", err.message);
            return res.status(500).json({ error: "Database error saving malfunction" });
        }
        console.log("POST /api/malfunctions - Malfunction saved with ID:", this.lastID);
        res.status(201).json({ message: "Malfunction saved", id: this.lastID });
    });
});

// --- Lessons API (לומדות) ---
app.get("/api/lessons", (req, res) => {
    console.log("GET /api/lessons - Request received");
    db.all("SELECT id, category, title, content, date FROM lessons ORDER BY category, title", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/lessons:", err.message);
            return res.status(500).json({ error: "Database error fetching lessons" });
        }
        console.log("GET /api/lessons - Fetched", rows.length, "lessons");
        res.json(rows);
    });
});

app.post("/api/lessons", (req, res) => {
    console.log("POST /api/lessons - Request body:", req.body);
    const { lessonTitle, lessonContent, category } = req.body;
    if (!lessonTitle || !lessonContent) {
        console.warn("POST /api/lessons - Missing lesson title or content");
        return res.status(400).json({ error: "Lesson title and content required" });
    }
    const date = new Date().toISOString();
    db.run("INSERT INTO lessons (category, title, content, date) VALUES (?, ?, ?, ?)", [category || null, lessonTitle, lessonContent, date], function (err) {
        if (err) {
            console.error("API Error POST /api/lessons:", err.message);
            return res.status(500).json({ error: "Database error adding lesson" });
        }
        console.log("POST /api/lessons - Lesson added with ID:", this.lastID);
        res.status(201).json({ message: "Lesson added", id: this.lastID });
    });
});

// --- Checklists API (צ'ק ליסט) ---
app.get("/api/checklists", (req, res) => {
    console.log("GET /api/checklists - Request received");
    db.all("SELECT id, item, checked, date_added FROM checklists ORDER BY date_added DESC", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/checklists:", err.message);
            return res.status(500).json({ error: "Database error fetching checklists" });
        }
        console.log("GET /api/checklists - Fetched", rows.length, "checklist items");
        res.json(rows);
    });
});

app.post("/api/checklists", (req, res) => {
    console.log("POST /api/checklists - Request body:", req.body);
    const { item } = req.body;
    if (!item) {
        console.warn("POST /api/checklists - Missing checklist item");
        return res.status(400).json({ error: "Checklist item required" });
    }
    const dateAdded = new Date().toISOString();
    db.run("INSERT INTO checklists (item, checked, date_added) VALUES (?, ?, ?)", [item, 0, dateAdded], function (err) {
        if (err) {
            console.error("API Error POST /api/checklists:", err.message);
            return res.status(500).json({ error: "Database error adding checklist item" });
        }
        console.log("POST /api/checklists - Checklist item added with ID:", this.lastID);
        res.status(201).json({ message: "Checklist item added", id: this.lastID });
    });
});

app.put("/api/checklists/:id", (req, res) => {
    const { id } = req.params;
    const { checked } = req.body;
    console.log("PUT /api/checklists/:id - ID:", id, "Body:", req.body);
    if (checked === undefined || typeof checked !== 'boolean') {
        console.warn("PUT /api/checklists/:id - Invalid checked status");
        return res.status(400).json({ error: "Checked status (boolean) required" });
    }
    db.run("UPDATE checklists SET checked = ? WHERE id = ?", [checked, id], function (err) {
        if (err) {
            console.error("API Error PUT /api/checklists/:id:", err.message);
            return res.status(500).json({ error: "Database error updating checklist item" });
        }
        console.log("PUT /api/checklists/:id - Checklist item", id, "updated, changes:", this.changes);
        res.json({ message: `Checklist item ${id} updated`, changes: this.changes });
    });
});

app.delete("/api/checklists/:id", (req, res) => {
    const { id } = req.params;
    console.log("DELETE /api/checklists/:id - ID:", id);
    db.run("DELETE FROM checklists WHERE id = ?", [id], function (err) {
        if (err) {
            console.error("API Error DELETE /api/checklists/:id:", err.message);
            return res.status(500).json({ error: "Database error deleting checklist item" });
        }
        console.log("DELETE /api/checklists/:id - Checklist item", id, "deleted, changes:", this.changes);
        res.json({ message: `Checklist item ${id} deleted`, changes: this.changes });
    });
});

// --- Updates API (עדכונים/הודעות) ---
app.get("/api/updates", (req, res) => {
    console.log("GET /api/updates - Request received");
    db.all("SELECT id, title, text, date FROM updates ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            console.error("API Error GET /api/updates:", err.message);
            return res.status(500).json({ error: "Database error fetching updates" });
        }
        console.log("GET /api/updates - Fetched", rows.length, "updates");
        res.json(rows);
    });
});

app.post("/api/updates", (req, res) => {
    console.log("POST /api/updates - Request body:", req.body);
    const { title, text } = req.body;
    if (!title || !text) {
        console.warn("POST /api/updates - Missing title or text for update");
        return res.status(400).json({ error: "Title and text required for update" });
    }
    const date = new Date().toISOString();
    db.run("INSERT INTO updates (title, text, date) VALUES (?, ?, ?)", [title, text, date], function (err) {
        if (err) {
            console.error("API Error POST /api/updates:", err.message);
            return res.status(500).json({ error: "Database error adding update" });
        }
        console.log("POST /api/updates - Update added with ID:", this.lastID);
        res.status(201).json({ message: "Update added", id: this.lastID });
    });
});

// --- File Upload API ---
app.post("/api/upload", upload.single("file"), (req, res) => {
    console.log("POST /api/upload - Request body:", req.body, "File:", req.file);
    if (!req.file) {
        console.warn("POST /api/upload - No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
    }
    const { idNumber } = req.body;
    if (!idNumber) {
        fs.unlink(req.file.path, (err) => err && console.error("Error deleting orphaned upload:", err));
        console.warn("POST /api/upload - Missing Student ID for file upload");
        return res.status(400).json({ error: "Student ID required for file upload" });
    }
    const relativeFilePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, "/");
    db.run("UPDATE students SET file_path = ? WHERE id_number = ?", [relativeFilePath, idNumber], function (err) {
        if (err) {
            fs.unlink(req.file.path, (delErr) => delErr && console.error("Error deleting file after failed DB update:", delErr));
            console.error("API Error POST /api/upload - Database error linking file:", err.message);
            return res.status(500).json({ error: "Failed to link file to student" });
        }
        console.log("POST /api/upload - File uploaded and linked to student ID:", idNumber, "at:", `/uploads/${relativeFilePath}`);
        res.json({ message: "File uploaded and linked", filePath: `/uploads/${relativeFilePath}` });
    });
});

function getStatusText(step) {
    switch (step) {
        case 1: return 'פרטים ראשוניים הוזנו';
        case 2: return 'טופס משאבי אנוש בהמתנה';
        case 3: return 'טופס משאבי אנוש הועלה';
        default: return 'לא ידוע';
    }
}

// --- Basic 404 Handler ---
app.use((req, res) => {
    console.warn("404 Not Found - URL:", req.originalUrl);
    res.status(404).json({ error: "Not Found" });
});

// --- Basic Error Handler ---
app.use((err, req, res, next) => {
    console.error("Unhandled Application Error:", err.stack || err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running successfully on http://localhost:${PORT}`);
    console.log(`   DB File: ${dbFile}`);
    console.log(`   Uploads Dir: ${uploadsDir}`);
    console.log(`   Public Dir: ${publicDir}`);
});

// --- Graceful Shutdown ---
function gracefulShutdown() {
    console.log("\nShutting down server...");
    db.close((err) => {
        if (err) console.error("Error closing database:", err.message);
        else console.log('Database closed.');
        process.exit(0);
    });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);