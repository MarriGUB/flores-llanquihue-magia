import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: express.Request, file: Express.Multer.File, cb: any) => cb(null, UPLOAD_DIR),
  filename: (req: express.Request, file: Express.Multer.File, cb: any) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g,'_')}`),
});
const upload = multer({ storage });

// Serve uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// Social links endpoints
app.get('/api/social-links', async (req: express.Request, res: express.Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_links ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/social-links', async (req: express.Request, res: express.Response) => {
  try {
    const { name, platform, url } = req.body;
    if (!name || !platform || !url) return res.status(400).json({ error: 'Missing fields' });
    const id = req.body.id || null;
    const [result] = await pool.query('INSERT INTO social_links (id, name, platform, url) VALUES (UUID(), ?, ?, ?)', [name, platform, url]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/social-links/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { name, platform, url } = req.body;
    await pool.query('UPDATE social_links SET name = ?, platform = ?, url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, platform, url, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/social-links/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM social_links WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Flowers endpoints
app.get('/api/flowers', async (req: express.Request, res: express.Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM flowers ORDER BY created_at DESC');
    const normalized = (rows as any[]).map((row) => ({
      ...row,
      image_url: row.image_url && row.image_url.startsWith('/') ? `${req.protocol}://${req.get('host')}${row.image_url}` : row.image_url,
    }));
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/upload', upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const host = req.get('host');
    const protocol = req.protocol;
    const url = host ? `${protocol}://${host}/uploads/${req.file.filename}` : `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/flowers', upload.none(), async (req: express.Request, res: express.Response) => {
  try {
    const { name, type, description, price, stock, image_url } = req.body;
    if (!name || !image_url) return res.status(400).json({ error: 'Missing fields' });
    const normalizedImageUrl = image_url.startsWith('/') ? `${req.protocol}://${req.get('host')}${image_url}` : image_url;
    await pool.query(
      'INSERT INTO flowers (id, name, type, description, price, stock, image_url, is_available) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1)',
      [name, type || null, description || null, parseFloat(price) || 0, parseInt(stock) || 0, normalizedImageUrl]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/flowers/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, price, stock, image_url, is_available } = req.body;
    await pool.query(
      'UPDATE flowers SET name = ?, type = ?, description = ?, price = ?, stock = ?, image_url = ?, is_available = ? WHERE id = ?',
      [name, type || null, description || null, parseFloat(price) || 0, parseInt(stock) || 0, image_url || null, is_available ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/flowers/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM flowers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = Number(process.env.PORT || 4000);

async function ensureTables() {
  try {
    const sqlPath = path.join(process.cwd(), 'migrations', 'mysql_create_tables.sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn('No migration SQL found at', sqlPath);
      return;
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Split statements by semicolon and execute non-empty ones
    const statements = sql
      .split(/;\s*\n|;\s*$/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err: any) {
        // If table already exists or other benign error, log and continue
        console.warn('Statement failed:', err?.message ?? err, stmt.slice(0, 80));
      }
    }
    console.log('Migration SQL executed (ensureTables)');
  } catch (err) {
    console.error('Failed to ensure tables:', err);
    throw err;
  }
}

(async () => {
  try {
    await ensureTables();
    app.listen(port, () => console.log(`API server listening on http://localhost:${port}`));
  } catch (err) {
    console.error('API failed to start:', err);
    process.exit(1);
  }
})();
