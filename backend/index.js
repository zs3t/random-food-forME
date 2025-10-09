const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

const app = express();
const host = process.env.BACKEND_HOST || '127.0.0.1';
const port = process.env.BACKEND_PORT || 9091;

app.use(cors());
app.use(express.json());

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'food_db.sqlite');

let db;
try {
  db = new Database(dbPath);
  console.log('Database connected successfully:', dbPath);
} catch (err) {
  console.error('Failed to connect to database:', err);
  process.exit(1);
}

app.get('/', (req, res) => {
    res.send('Food API is running!');
});

// Get all foods or filtered foods
app.get('/foods', asyncHandler(async (req, res) => {
    const category = req.query.category;
    let sql = 'SELECT * FROM foods';
    const params = [];

    if (category && category !== 'all') {
        sql += ' WHERE category = ?';
        params.push(category);
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    res.json(rows);
}));

// Get a single food by ID
app.get('/foods/:id', asyncHandler(async (req, res) => {
    const stmt = db.prepare('SELECT * FROM foods WHERE id = ?');
    const row = stmt.get(req.params.id);
    if (!row) {
        const error = new Error('Food not found');
        error.statusCode = 404;
        throw error;
    }
    res.json(row);
}));

// Create a new food
app.post('/foods', asyncHandler(async (req, res) => {
    const { name, category, description, tags } = req.body;
    if (!name || !category) {
        const error = new Error('Name and category are required');
        error.statusCode = 400;
        error.name = 'ValidationError';
        throw error;
    }
    const tagsString = tags ? JSON.stringify(tags) : null;
    const stmt = db.prepare('INSERT INTO foods (name, category, description, tags) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, category, description, tagsString);
    res.status(201).json({id: info.lastInsertRowid, name, category, description, tags: tagsString});
}));

// Update an existing food
app.put('/foods/:id', asyncHandler(async (req, res) => {
    const { name, category, description, tags } = req.body;
    if (!name || !category) {
        const error = new Error('Name and category are required');
        error.statusCode = 400;
        error.name = 'ValidationError';
        throw error;
    }
    const tagsString = tags ? JSON.stringify(tags) : null;
    const stmt = db.prepare('UPDATE foods SET name = ?, category = ?, description = ?, tags = ? WHERE id = ?');
    const info = stmt.run(name, category, description, tagsString, req.params.id);
    if (info.changes === 0) {
        const error = new Error('Food not found');
        error.statusCode = 404;
        throw error;
    }
    res.json({id: parseInt(req.params.id), name, category, description, tags: tagsString});
}));

// Delete a food
app.delete('/foods/:id', asyncHandler(async (req, res) => {
    const stmt = db.prepare('DELETE FROM foods WHERE id = ?');
    const info = stmt.run(req.params.id);
    if (info.changes === 0) {
        const error = new Error('Food not found');
        error.statusCode = 404;
        throw error;
    }
    res.json({"message": "Food deleted", id: req.params.id});
}));

// 404 handler - 必须在所有路由之后
app.use(notFoundHandler);

// Error handling middleware - 必须在最后
app.use(errorHandler);

app.listen(port, host, () => {
    console.log(`Server listening at http://${host}:${port}`);
});
