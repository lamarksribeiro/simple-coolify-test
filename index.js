const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Database connection configuration
// Defaults to user-provided local credentials
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASS || 'ba1f652bf11649ddabc02b734942b7bb',
  port: process.env.DB_PORT || 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));

// Ensure table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating table:', err));

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    const messages = result.rows;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Guestbook</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .message { border-bottom: 1px solid #eee; padding: 10px 0; }
          .meta { color: #888; font-size: 0.8em; }
          form { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box; }
          button { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h1>Guestbook</h1>
        
        <form action="/add" method="POST">
          <input type="text" name="name" placeholder="Your Name" required>
          <textarea name="message" placeholder="Your Message" required></textarea>
          <button type="submit">Sign Guestbook</button>
        </form>

        <h2>Messages</h2>
        <div id="messages">
    `;

    if (messages.length === 0) {
      html += '<p>No messages yet. Be the first!</p>';
    } else {
      messages.forEach(msg => {
        html += `
          <div class="message">
            <strong>${msg.name}</strong> <span class="meta">${new Date(msg.created_at).toLocaleString()}</span>
            <p>${msg.message}</p>
          </div>
        `;
      });
    }

    html += `
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving messages');
  }
});

app.post('/add', async (req, res) => {
  const { name, message } = req.body;
  try {
    const client = await pool.connect();
    await client.query('INSERT INTO messages (name, message) VALUES ($1, $2)', [name, message]);
    client.release();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving message');
  }
});

// Endpoint de healthcheck — verifica app e conexão com banco
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Guestbook app listening on port ${port}`);
});
