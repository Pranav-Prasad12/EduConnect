const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Allow the browser to securely send DELETE commands
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
}));

const db = new sqlite3.Database('./educonnect.db', (err) => {
    if (err) console.error(err.message);
    console.log('✅ Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, standard INTEGER NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        fileName TEXT,
        author TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author) REFERENCES users(username)
    )`);
});

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use('/api/files', express.static(path.join(__dirname, 'uploads')));

app.post('/api/users', (req, res) => {
    const { username, standard } = req.body;
    db.run(`INSERT INTO users (username, standard) VALUES (?, ?)`, [username, standard], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'User created', username });
    });
});

app.get('/api/notes', (req, res) => {
    db.all(`SELECT * FROM notes ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});
    
app.post('/api/notes', upload.single('file'), (req, res) => {
    const { title, subject, author } = req.body;
    const fileName = req.file.originalname;
    
    db.run(`INSERT INTO notes (title, subject, fileName, author) VALUES (?, ?, ?, ?)`, 
        [title, subject, fileName, author], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// SAFE DELETE ROUTE
app.delete('/api/notes/:id', (req, res) => {
    const id = req.params.id;
    
    db.get(`SELECT fileName FROM notes WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: "Note not found in database." });
        }

        // 1. Delete from the database first
        db.run(`DELETE FROM notes WHERE id = ?`, [id], (dbErr) => {
            if (dbErr) {
                return res.status(500).json({ error: "Could not delete from DB." });
            }
            
            // 2. Safely try to delete the file
            try {
                const filePath = path.join(__dirname, 'uploads', row.fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                // If the computer has the file locked, we ignore the error so the server doesn't crash
                console.log("File is locked or missing, but database record was deleted.");
            }
            
            // 3. Always reply success
            res.json({ success: true });
        });
    });
});

app.listen(PORT, '127.0.0.1', () => console.log(`🚀 Back-end server running on http://127.0.0.1:${PORT}`));