require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const soap    = require('soap');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3      = require('./s3Client');

const app    = express();
const PORT   = process.env.PORT || 5001;
const BUCKET = process.env.SPACES_BUCKET;
const REGION = process.env.SPACES_REGION || 'sgp1';

// SOAP service URL (cloud дээр байрлах үед env-ээс авна)
const SOAP_WSDL = process.env.SOAP_WSDL_URL || 'http://localhost:4000/soap?wsdl';

app.use(cors());
app.use(express.json());

// Multer — зөвхөн санах ойд хадгална (disk рүү бичихгүй)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Зөвхөн зураг (JPEG, PNG, GIF, WEBP) оруулна уу'));
    }
  }
});

// ── SOAP Token шалгах middleware ─────────────────────────────────
async function validateSoapToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token шаардлагатай' });
  }

  const token = header.substring(7);

  try {
    const client = await soap.createClientAsync(SOAP_WSDL);
    const [result] = await client.ValidateTokenAsync({ token });

    if (result.valid === true || result.valid === 'true') {
      req.userId   = result.userId;
      req.username = result.username;
      next();
    } else {
      res.status(401).json({ error: 'Token хүчингүй' });
    }
  } catch (err) {
    console.error('SOAP холболтын алдаа:', err.message);
    res.status(500).json({ error: 'Auth service холбогдсонгүй' });
  }
}

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'File Manager Service', port: PORT });
});

// ── POST /upload — зураг хуулах ──────────────────────────────────
app.post('/upload', validateSoapToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл сонгоогүй байна' });
  }

  // Давхардахгүй нэр үүсгэх
  const timestamp = Date.now();
  const safeName  = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName  = `avatars/${req.userId}_${timestamp}_${safeName}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         fileName,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
      ACL:         'public-read'
    }));

    // DigitalOcean Spaces public URL
    const fileUrl = `https://${BUCKET}.${REGION}.digitaloceanspaces.com/${fileName}`;

    res.json({
      success:  true,
      message:  'Зураг амжилттай хуулагдлаа',
      url:      fileUrl,
      fileName: fileName
    });
  } catch (err) {
    console.error('Upload алдаа:', err.message);
    res.status(500).json({ error: 'Зураг хуулахад алдаа гарлаа: ' + err.message });
  }
});

// ── DELETE /file — зураг устгах ──────────────────────────────────
app.delete('/file', validateSoapToken, async (req, res) => {
  const { fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'fileName шаардлагатай' });
  }

  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key:    fileName
    }));
    res.json({ success: true, message: 'Файл устгагдлаа' });
  } catch (err) {
    console.error('Delete алдаа:', err.message);
    res.status(500).json({ error: 'Файл устгахад алдаа гарлаа' });
  }
});

// ── Multer алдааг барих ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message.includes('Зөвхөн зураг')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Серверийн алдаа' });
});

app.listen(PORT, () => {
  console.log(`✅ File Manager Service: http://localhost:${PORT}`);
  console.log(`📦 Bucket: ${BUCKET || '(SPACES_BUCKET тохируулаагүй)'}`);
});
