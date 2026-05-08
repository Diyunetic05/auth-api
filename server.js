const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SECRET = process.env.JWT_SECRET || 'mysecret';
const db = new sqlite3.Database('./auth.db');

// Create tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
)`);

db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL
)`);

// Auth middleware
function auth(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// Admin middleware
function admin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    db.get('SELECT COUNT(*) as count FROM users', [], async (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const role = result.count === 0 ? 'admin' : 'user';
        const hashed = await bcrypt.hash(password, 10);

        db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashed, role],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({ error: 'User already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'Signup successful!', role });
            });
    });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email, role: user.role }, SECRET);
        res.json({ message: 'Login successful!', token, role: user.role });
    });
});

// Get user profile
app.get('/me', auth, (req, res) => {
    db.get('SELECT id, email, role FROM users WHERE id = ?', [req.user.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            message: 'Your profile information',
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    });
});

// GET all notes
app.get('/notes', auth, (req, res) => {
    db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC', [req.user.userId], (err, notes) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ notes: notes || [] });
    });
});

// CREATE note
app.post('/notes', auth, (req, res) => {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    db.run('INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)',
        [title, content || '', req.user.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Create failed' });
            res.status(201).json({ message: 'Note created!', id: this.lastID });
        });
});

// UPDATE note
app.put('/notes/:id', auth, (req, res) => {
    const { title, content } = req.body;
    const noteId = req.params.id;

    if (!title) return res.status(400).json({ error: 'Title required' });

    db.run('UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
        [title, content, noteId, req.user.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Update failed' });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Note not found or access denied' });
            }
            res.json({ message: 'Note updated!' });
        });
});

// DELETE note
app.delete('/notes/:id', auth, (req, res) => {
    const noteId = req.params.id;

    db.run('DELETE FROM notes WHERE id = ? AND user_id = ?',
        [noteId, req.user.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Delete failed' });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Note not found or access denied' });
            }
            res.json({ message: 'Note deleted!' });
        });
});

// Admin routes
app.get('/admin/users', auth, admin, (req, res) => {
    db.all('SELECT id, email, role FROM users', [], (err, users) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ users });
    });
});

app.delete('/admin/user/:id', auth, admin, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted!' });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== IMPORTANT FOR RENDER DEPLOYMENT ==========
// Only start server if this file is run directly (not in test)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for testing
module.exports = app;