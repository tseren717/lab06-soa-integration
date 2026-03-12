const express        = require('express');
const cors           = require('cors');
const db             = require('./database');
const authMiddleware = require('./authMiddleware');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ── POST /users — профайл үүсгэх ─────────────────────────────────
app.post('/users', authMiddleware, (req, res) => {
  const { name, email, bio, phone, location, avatar } = req.body;
  const id = req.userId;

  db.run(
    `INSERT OR REPLACE INTO profiles (id, name, email, bio, phone, location, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, bio || '', phone || '', location || '', avatar || ''],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Профайл үүсгэгдлээ', id });
    }
  );
});

// ── GET /users/:id — профайл авах ────────────────────────────────
app.get('/users/:id', authMiddleware, (req, res) => {
  db.get('SELECT * FROM profiles WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профайл олдсонгүй' });
    res.json(row);
  });
});

// ── PUT /users/:id — профайл шинэчлэх ───────────────────────────
app.put('/users/:id', authMiddleware, (req, res) => {
  const { name, bio, phone, location, avatar } = req.body;

  db.run(
    `UPDATE profiles SET name=?, bio=?, phone=?, location=?, avatar=?
     WHERE id=?`,
    [name, bio || '', phone || '', location || '', avatar || '', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Профайл шинэчлэгдлээ' });
    }
  );
});

// ── DELETE /users/:id — профайл устгах ──────────────────────────
app.delete('/users/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM profiles WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Профайл устгагдлаа' });
  });
});

app.listen(PORT, () => {
  console.log(`✅ JSON Service: http://localhost:${PORT}`);
});