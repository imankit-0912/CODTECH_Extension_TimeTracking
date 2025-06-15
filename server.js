// Backend API server for ProductivityTracker extension
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: ['chrome-extension://*', 'http://localhost:*'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Initialize SQLite database
const db = new sqlite3.Database('productivity.db');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Time entries table
    db.run(`
        CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            url TEXT NOT NULL,
            domain TEXT NOT NULL,
            title TEXT,
            time_spent INTEGER NOT NULL,
            category TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);
    
    // Website categories table
    db.run(`
        CREATE TABLE IF NOT EXISTS website_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            user_defined BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // User settings table
    db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            settings JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);
    
    // Insert default website categories
    const defaultCategories = [
        // Productive sites
        ['github.com', 'productive'],
        ['stackoverflow.com', 'productive'],
        ['codepen.io', 'productive'],
        ['repl.it', 'productive'],
        ['leetcode.com', 'productive'],
        ['hackerrank.com', 'productive'],
        ['coursera.org', 'productive'],
        ['udemy.com', 'productive'],
        ['khanacademy.org', 'productive'],
        ['docs.google.com', 'productive'],
        ['notion.so', 'productive'],
        ['trello.com', 'productive'],
        ['atlassian.com', 'productive'],
        ['slack.com', 'productive'],
        
        // Unproductive sites
        ['facebook.com', 'unproductive'],
        ['twitter.com', 'unproductive'],
        ['instagram.com', 'unproductive'],
        ['tiktok.com', 'unproductive'],
        ['youtube.com', 'unproductive'],
        ['netflix.com', 'unproductive'],
        ['reddit.com', 'unproductive'],
        ['pinterest.com', 'unproductive'],
        ['snapchat.com', 'unproductive'],
        ['twitch.tv', 'unproductive']
    ];
    
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO website_categories (domain, category) 
        VALUES (?, ?)
    `);
    
    defaultCategories.forEach(([domain, category]) => {
        stmt.run(domain, category);
    });
    
    stmt.finalize();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ error: 'Email already registered' });
                    }
                    return res.status(500).json({ error: 'Registration failed' });
                }
                
                const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
                res.json({ 
                    token, 
                    user: { id: this.lastID, email },
                    message: 'Registration successful' 
                });
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            try {
                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
                res.json({ 
                    token, 
                    user: { id: user.id, email: user.email },
                    message: 'Login successful' 
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Login failed' });
            }
        }
    );
});

// Create time entry
app.post('/api/time-entries', authenticateToken, (req, res) => {
    const { url, domain, title, timeSpent, category, timestamp, date } = req.body;
    const userId = req.user.userId;
    
    db.run(`
        INSERT INTO time_entries 
        (user_id, url, domain, title, time_spent, category, timestamp, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, url, domain, title, timeSpent, category, timestamp, date], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to save time entry' });
        }
        
        res.json({ 
            id: this.lastID, 
            message: 'Time entry saved successfully' 
        });
    });
});

// Get time entries
app.get('/api/time-entries', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 1000 } = req.query;
    
    let query = 'SELECT * FROM time_entries WHERE user_id = ?';
    let params = [userId];
    
    if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch time entries' });
        }
        
        res.json(rows);
    });
});

// Get analytics
app.get('/api/analytics', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { period = 'week' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get aggregated stats
    db.all(`
        SELECT 
            category,
            COUNT(*) as sessions,
            SUM(time_spent) as total_time,
            AVG(time_spent) as avg_time,
            domain
        FROM time_entries 
        WHERE user_id = ? AND date >= ?
        GROUP BY category, domain
        ORDER BY total_time DESC
    `, [userId, startDateStr], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch analytics' });
        }
        
        // Process and structure the analytics data
        const analytics = {
            period: period,
            totalTime: 0,
            categories: { productive: 0, unproductive: 0, neutral: 0 },
            topSites: [],
            dailyBreakdown: {}
        };
        
        const siteStats = {};
        
        rows.forEach(row => {
            analytics.totalTime += row.total_time;
            analytics.categories[row.category] += row.total_time;
            
            if (!siteStats[row.domain]) {
                siteStats[row.domain] = {
                    domain: row.domain,
                    category: row.category,
                    totalTime: 0,
                    sessions: 0
                };
            }
            
            siteStats[row.domain].totalTime += row.total_time;
            siteStats[row.domain].sessions += row.sessions;
        });
        
        analytics.topSites = Object.values(siteStats)
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 10);
        
        res.json(analytics);
    });
});

// Update website category
app.put('/api/website-categories/:domain', authenticateToken, (req, res) => {
    const { domain } = req.params;
    const { category } = req.body;
    
    if (!['productive', 'unproductive', 'neutral'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    
    db.run(`
        INSERT OR REPLACE INTO website_categories (domain, category, user_defined)
        VALUES (?, ?, TRUE)
    `, [domain, category], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update category' });
        }
        
        res.json({ message: 'Category updated successfully' });
    });
});

// Get website categories
app.get('/api/website-categories', (req, res) => {
    db.all('SELECT domain, category FROM website_categories', (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        
        const categories = {};



        
        rows.forEach(row => {
            categories[row.domain] = row.category;
        });

        res.json(categories);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});