# SOA Lab 06 & 07 — JSON + SOAP + File Manager

## Архитектур

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Static)                    │
│          login.html / register.html / profile.html       │
└────────────┬──────────────────────┬─────────────────────┘
             │ REST                 │ REST (upload)
             ▼                      ▼
┌────────────────────┐   ┌──────────────────────┐
│  User JSON Service │   │  File Manager Service │
│     (port 3000)    │   │      (port 5000)      │
│  CRUD /users/:id   │   │  POST /upload         │
└────────┬───────────┘   └──────────┬────────────┘
         │ SOAP ValidateToken        │ SOAP ValidateToken
         └──────────┬────────────────┘
                    ▼
         ┌──────────────────────┐
         │  User SOAP Service   │
         │     (port 4000)      │
         │  RegisterUser        │
         │  LoginUser           │
         │  ValidateToken       │
         └──────────────────────┘
                    │
         ┌──────────┴──────────┐
         │    auth.db          │   ← SQLite (local)
         │  (users + tokens)   │       эсвэл Cloud DB
         └─────────────────────┘

File Manager → DigitalOcean Spaces (S3-compatible)
JSON Service → profiles.db (SQLite) эсвэл Cloud DB
```

---

## Өгөгдлийн сангийн шийдвэр

**Option 2 — Independent Databases** сонгосон:
- `user-soap-service` → `auth.db` (users, tokens)
- `user-json-service` → `profiles.db` (profile мэдээлэл)

Давуу тал: сервис бүр өөрийн өгөгдлийг эзэмшинэ, нэг нь унтарсан ч нөгөө нь ажиллана.

---

## Локал суулгах заавар

### Шаардлага
- Node.js 18+
- npm

### 1. SOAP Auth Service

```bash
cd user-soap-service
cp .env.example .env        # .env файл үүсгэж утгуудыг тохируулна
npm install
node server.js
# → http://localhost:4000/soap?wsdl
```

### 2. User JSON Service

```bash
cd user-json-service
cp .env.example .env
npm install
node server.js
# → http://localhost:3000
```

### 3. File Manager Service

```bash
cd file-manager-service
cp .env.example .env        # Spaces credentials оруулна
npm install
node server.js
# → http://localhost:5000
```

### 4. Frontend

```bash
# Хялбар HTTP server ажиллуулна
cd frontend-app
npx serve .
# → http://localhost:3001
```

---

## Cloud Deployment (Lab 07 — DigitalOcean)

### Бэлтгэл
1. [GitHub Student Pack](https://education.github.com/pack) → DigitalOcean $200 кредит авна
2. DigitalOcean дээр **SOA-Project** үүсгэнэ
3. Сервис бүрийг тусдаа GitHub repo-д push хийнэ

### SOAP Service → Droplet (VPS)

```bash
# DigitalOcean → Create → Droplets → Docker Marketplace image
# SSH нэвтэрнэ
ssh root@<droplet_ip>

git clone <your-soap-service-repo>
cd user-soap-service
cp .env.example .env && nano .env   # JWT_SECRET тохируулна

npm install
# PM2-ээр ажиллуулна (дахин эхлэхэд автоматаар асна)
npm install -g pm2
pm2 start server.js --name soap-service
pm2 save && pm2 startup
```

**Firewall:** DigitalOcean → Networking → Firewalls → port **4000** нээнэ.

### JSON Service → App Platform

1. DigitalOcean → **Create → Apps** → GitHub repo холбоно
2. Environment Variables нэмнэ:
   ```
   SOAP_WSDL_URL = http://<droplet_ip>:4000/soap?wsdl
   PORT          = 3000
   ```
3. **Automatic Deploy on Push** идэвхжүүлнэ

### File Manager Service → App Platform

1. DigitalOcean → **Create → Apps** → GitHub repo холбоно
2. Environment Variables нэмнэ:
   ```
   SPACES_ACCESS_KEY = <your key>
   SPACES_SECRET_KEY = <your secret>
   SPACES_BUCKET     = <bucket name>
   SPACES_REGION     = sgp1
   SOAP_WSDL_URL     = http://<droplet_ip>:4000/soap?wsdl
   PORT              = 5000
   ```

### Frontend → Static Site (үнэгүй)

1. `frontend-app` дотор **localhost URL-уудыг** DigitalOcean URL-аар солино:
   ```js
   const JSON_SERVICE_URL = 'https://<json-app>.ondigitalocean.app';
   const FILE_SERVICE_URL = 'https://<file-app>.ondigitalocean.app';
   // login.html, register.html дотор SOAP URL:
   // 'http://<droplet_ip>:4000/soap'
   ```
2. DigitalOcean → **Create → Apps → Static Site** → deploy хийнэ (100% үнэгүй)

### DigitalOcean Spaces тохируулах

```
Create → Spaces → Singapore (sgp1) → Bucket нэр өгнө
API → Tokens → Spaces Keys → Generate New Key
  → Access Key болон Secret Key-г .env-д хадгална
```

---

## API Reference

### SOAP Service (port 4000)

| Operation | Input | Output |
|-----------|-------|--------|
| `RegisterUser` | username, password, email | success, message, userId |
| `LoginUser` | username, password | success, token, userId |
| `ValidateToken` | token | valid, userId, username, role |

### JSON REST Service (port 3000)

| Method | Endpoint | Auth | Тайлбар |
|--------|----------|------|---------|
| POST | `/users` | ✅ | Профайл үүсгэх |
| GET | `/users/:id` | ✅ | Профайл авах |
| PUT | `/users/:id` | ✅ | Профайл шинэчлэх |
| DELETE | `/users/:id` | ✅ | Профайл устгах |

### File Manager Service (port 5000)

| Method | Endpoint | Auth | Тайлбар |
|--------|----------|------|---------|
| POST | `/upload` | ✅ | Зураг хуулах (multipart/form-data, field: `file`) |
| DELETE | `/file` | ✅ | Зураг устгах (`{ fileName }`) |
| GET | `/health` | ❌ | Сервис ажиллаж байгаа эсэх |

### Authentication Flow

```
1. Register:  Frontend → SOAP RegisterUser → auth.db
2. Login:     Frontend → SOAP LoginUser → JWT token → localStorage
3. API call:  Frontend → JSON/File Service → authMiddleware → SOAP ValidateToken → allow/deny
```

---

## Bonus Tasks

- **Bonus 1 (RBAC):** `authService.js` дотор `role` талбар бэлэн байна (`user` / `admin`)
- **Bonus 3 (JWT):** SOAP service JWT (`jsonwebtoken`) ашиглаж байна ✅
