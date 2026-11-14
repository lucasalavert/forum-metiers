# Forum des Métiers & de l'Orientation (White-Label Edition)

A self-hosted, open-source web application (**FastAPI + React 18 / TypeScript**) designed for high schools (*lycées*) to collect student career-fair workshop preferences, optimize student-to-session allocation across **2 to 6 configurable rotations**, perform manual arbitration, and publish personalized student schedules and room attendance sheets.

This edition is **100% white-label** and ships **without any pre-seeded demo data**: every school configures its own identity, logo, schedule, workshops, and student roster cleanly from scratch.

---

## ✨ Key Features

- **White-Label School Identity (`/admin/config`)**: Configure the school name, city/subtitle, ENT/messaging platform name (e.g., *Pronote*, *ÉcoleDirecte*, *MBN*, *ENT*), school website URL, and custom logo (upload SVG/PNG/JPG/WebP up to 500 KB stored in SQLite, provide an external HTTPS URL, or use the built-in generic emblem) with live light/dark previews and dynamic favicon synchronization.
- **Customizable Rotations & Specialty Rules (`/admin/config`)**:
  - Choose between **2 and 6 rotations** (`R1` to `R6`) with custom `HH:MM` start/end times.
  - Configure **`0`, `1`, or `2` mandatory specialty-presentation slots** for `2NDE` students (or override per class as `AUTO`, `NONE`, or specific rotations).
  - Minimum student wish count automatically adapts to the number of career-workshop slots (`max(2, rotations_count - specialty_slots)`).
- **Passwordless Student Portal (`/v/:token`)**: Each student receives a unique HMAC-derived URL and QR code—no student password management required.
  - Real-time catalog filtering by grade level (`2NDE`, `1ERE`, `TERM`).
  - Ordered preference ranking with intuitive reordering and automatic server-side enforcement of the wish submission window (`wishes_open`).
  - Instant display of the student's finalized schedule (time slot, room, speaker) once allocations are published.
- **Security & Anti-Bruteforce Built In**:
  - All administration endpoints (`/students`, `/allocations`, `/formations` write operations, `/config` updates) require a valid signed admin Bearer token (`HTTP 401`).
  - Sliding-window rate limiters protect `/api/v1/auth/login` against password brute-forcing (`HTTP 429` after 5 failed attempts) and `/api/v1/portal/:token` against student URL enumeration (`HTTP 429` after 15 invalid token lookups).
  - OpenAPI/Swagger endpoints (`/docs`, `/redoc`, `/openapi.json`) are automatically disabled when `APP_ENV=production`.
- **Deterministic Optimization Solver (`SolverEngine`)**:
  - Computes workshop tension ratios to prioritize highly requested workshops.
  - Balances occupancy across all 4 rotations and performs post-assignment 2-opt satisfaction swaps.
  - Preserves manually locked (`🔒`) assignments during re-runs.
- **Administration, Analytics & Exports**:
  - Multi-admin user management (PBKDF2-HMAC-SHA256 password hashing).
  - ECharts satisfaction charts, tension bar charts, and 4-rotation occupancy heatmaps.
  - One-click CSV exports for room attendance sheets, class schedules, and student ENT mailing merges.

---

## 📋 Minimum System Requirements

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 512 MB | 1 GB (especially during initial Docker multi-stage frontend build) |
| **Disk** | 1 GB free | 2 GB+ (SQLite database + Docker image layers) |
| **OS** | Linux (x86_64 / ARM64), macOS, or Windows (WSL2) | Debian / Ubuntu LTS |
| **Runtime (Docker)** | Docker Engine `>= 24.0`, Docker Compose `v2+` | Docker Compose `v2+` |
| **Runtime (Bare-Metal)** | Python `3.12+`, Node.js `20+`, npm `10+` | — |

The application runs in a single container serving both the FastAPI REST API (`/api/v1`) and the pre-built React SPA (`/`) on port `8000` via Uvicorn. Typical memory usage at runtime for a 500-student school is **< 120 MB**, and full solver runs take **< 0.3 seconds**.

---

## 🚀 Installation & Reverse Proxy Deployment

### 1. Prepare Environment Configuration

Clone the repository and create a `.env` file from the template:

```bash
git clone <your-repo-url> forum-metiers
cd forum-metiers
cp .env.example .env
```

Edit `.env` (or pass environment variables directly in Portainer / Docker Compose) before starting:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `APP_ENV` | Runtime mode (`production` or `development`) | `production` |
| `APP_PORT` | Internal HTTP port listened to by Uvicorn | `8000` |
| `DATABASE_URL` | SQLAlchemy database connection string | `sqlite:////app/data/forum_metiers.db` |
| `ADMIN_USERNAME` | Initial admin login username | `admin` |
| `ADMIN_EMAIL` | Initial admin email address | `admin@etablissement.fr` |
| `ADMIN_PASSWORD` | Initial admin password (**synced on startup**) | `ChangeMeBeforeDeploy2027!` |
| `ADMIN_SECRET_KEY` | Signing secret for admin bearer tokens | *Random 32+ char string* |
| `STUDENT_TOKEN_SALT` | Salt used to generate student portal tokens | *Random 32+ char string* |
| `CORS_ORIGINS` | JSON array of allowed browser origins | `["https://forum.example.org"]` |
| `DEFAULT_SCHOOL_NAME` | Initial school name on first DB bootstrap | `Lycée Général et Technologique` |
| `DEFAULT_SCHOOL_SUBTITLE` | Initial subtitle/city on first DB bootstrap | `Forum de l'Orientation` |
| `DEFAULT_SCHOOL_WEBSITE_URL` | Optional link shown in the student/home footer | `""` |
| `DEFAULT_ENT_NAME` | Initial messaging/ENT name in instructions | `Pronote / ÉcoleDirecte` |
| `DEFAULT_FORMATION_CAPACITY` | Default workshop capacity per rotation | `20` |

> **Security Note**: On startup, the backend ensures an administrator account exists matching `ADMIN_USERNAME` / `ADMIN_EMAIL` and synchronizes its password hash with `ADMIN_PASSWORD`. Always override `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`, and `STUDENT_TOKEN_SALT` in production.

---

### 2. Run with Docker Compose (Standalone / Host Reverse Proxy)

By default, [docker-compose.prod.yml](./docker-compose.prod.yml) builds the multi-stage [Dockerfile](./Dockerfile), binds `127.0.0.1:8000` on the host, and persists SQLite data in the `forum_metiers_data` Docker volume (`/app/data`).

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verify the container health endpoint:

```bash
curl -s http://127.0.0.1:8000/api/health
# Expected: {"status":"ok","service":"forum-orientation-api"}
```

---

### 3. Reverse Proxy Examples (HTTPS)

#### Option A: Traefik (Docker Labels + Let's Encrypt)

When deploying behind an existing Traefik reverse proxy connected to an external `traefik-public` Docker network, replace `ports` in `docker-compose.prod.yml` with the Traefik network and labels:

```yaml
services:
  web:
    build: .
    image: ${IMAGE_NAME:-forum-metiers:latest}
    container_name: ${STACK_NAME:-forum-metiers}
    restart: unless-stopped
    environment:
      - APP_ENV=production
      - APP_PORT=8000
      - DATABASE_URL=sqlite:////app/data/forum_metiers.db
      - ADMIN_USERNAME=admin
      - ADMIN_EMAIL=admin@school.example.org
      - ADMIN_PASSWORD=StrongProdPassword2027!
      - ADMIN_SECRET_KEY=replace_with_long_random_secret
      - STUDENT_TOKEN_SALT=replace_with_long_random_salt
      - CORS_ORIGINS=["https://forum.school.example.org"]
    volumes:
      - forum_metiers_data:/app/data
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.forum-metiers.rule=Host(`forum.school.example.org`)"
      - "traefik.http.routers.forum-metiers.entrypoints=websecure"
      - "traefik.http.routers.forum-metiers.tls.certresolver=letsencrypt-http"
      - "traefik.http.services.forum-metiers.loadbalancer.server.port=8000"

volumes:
  forum_metiers_data:
    driver: local

networks:
  traefik-public:
    external: true
```

#### Option B: Nginx

Keep `ports: ["127.0.0.1:8000:8000"]` in `docker-compose.prod.yml` and add an Nginx virtual host (`/etc/nginx/sites-available/forum-metiers.conf`):

```nginx
server {
    listen 80;
    server_name forum.school.example.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name forum.school.example.org;

    ssl_certificate     /etc/letsencrypt/live/forum.school.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forum.school.example.org/privkey.pem;

    # Allow uploading school logos (up to 500 KB base64 payload) and CSV files
    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option C: Apache (`httpd`)

Enable `mod_proxy`, `mod_proxy_http`, `mod_headers`, and `mod_ssl` (`a2enmod proxy proxy_http headers ssl`), keep `127.0.0.1:8000:8000` exposed locally, and configure your VirtualHost:

```apache
<VirtualHost *:80>
    ServerName forum.school.example.org
    Redirect permanent / https://forum.school.example.org/
</VirtualHost>

<VirtualHost *:443>
    ServerName forum.school.example.org

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/forum.school.example.org/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/forum.school.example.org/privkey.pem

    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    ProxyPass        / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/
</VirtualHost>
```

---

### 4. Local Development Setup

Start both FastAPI (`http://localhost:8190`) and Vite (`http://localhost:5190`) with hot reload:

```bash
# With Docker Compose (recommended)
./start_local.sh

# Or bare-metal (Python venv + Node.js)
./start_local.sh --no-docker
```

Run tests locally:

```bash
# Backend tests (Pytest)
PYTHONPATH="backend:." pytest backend/tests -v

# Frontend tests & production bundle
cd frontend && npm test -- --run && npm run build
```

---

## 🎨 Customizing the Interface for Your School's Brand

### A. Runtime Branding, Theme Colors &Logo via `/admin/config` (No Rebuild Required)

Sign in at `/admin/login` and open **Configuration Forum (`/admin/config`)**:

1. **Identité de l'Établissement & Marque Blanche**:
   - **Nom complet de l'établissement**: Displayed in public headers, admin header, login page, browser `<title>`, and footers.
   - **Ville / Sous-titre**: Shown below/alongside the school name.
   - **ENT / Messagerie élèves**: Dynamically adapts student instructions on the home page (e.g., *Pronote*, *ÉcoleDirecte*, *MonBureauNumérique*).
   - **Site web de l'établissement**: Adds an external link in the public home footer when set.
   - **Consignes « Comment accéder à votre espace élève ? »**: Customize the step-by-step instructions displayed on the public home page (`/`) — one line per numbered step (or leave blank for automatic ENT instructions).
2. **Couleurs du thème (Charte graphique)**:
   - Pick your school's **Primary color** (sidebar & main headings, default `#272154`), **Secondary color** (buttons & badges, default `#312783`), and **Accent color** (active items & highlights, default `#EB5E57`) directly in the admin UI with live preview across the entire application—no CSS edit or Docker rebuild required.
3. **Logo de l'établissement**:
   - Click **Importer un fichier** to upload an **SVG, PNG, JPG, or WebP** logo (max **500 KB**). It is encoded as a Data URL and persisted directly inside the SQLite `event_config` table—no separate file volume is required.
   - Uploaded **SVG** logos automatically invert their dark main fill to `#FFFFFF` on dark backgrounds (admin sidebar) and isolate their emblem in collapsed sidebar / favicon views.
   - Or paste an external `https://...` image URL, or click **Sans image / Défaut** to use the built-in generic graduation emblem.

### B. Advanced CSS & Typography Customization (Optional)

If you also wish to customize fonts or background canvas tokens in source code before building:

1. **CSS Variables (`frontend/src/index.css`)**:

```css
:root {
  --c-primary: #EB5E57;     /* Overridden at runtime by theme_accent_color */
  --bleu-nuit: #272154;     /* Overridden at runtime by theme_primary_color */
  --bleu-fonce: #312783;    /* Overridden at runtime by theme_secondary_color */
  --light-beige: #F3F1F0;   /* Page canvas background */
}
```

---

## 📥 Onboarding Workflow, Demo Dataset & CSV Import Reference

Because this open-source release includes **zero pre-seeded demo data** in the database by default, setting up a new event takes four straightforward steps in the admin UI (or you can import the included [`demo/`](./demo/README.md) dataset in 3 clicks to test a full 450-student forum):

1. **Log in** at `/admin/login` using your configured `ADMIN_USERNAME` / `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
2. **Configure your event** in `/admin/config` (school identity, logo, event date, number of rotations `2`–`6`, Seconde specialty slots `0`–`2`, and whether student wish submission is open).
3. **Import Workshops & Students via CSV** (or use [`demo/formations.csv`](./demo/formations.csv), [`demo/students.csv`](./demo/students.csv), and [`demo/wishes.csv`](./demo/wishes.csv) for a complete demo).
4. **Distribute links & run the solver**: Export student links (`/admin/students`) to send via your ENT, or open individual QR codes. Once wishes are collected, go to `/admin/arbitrage` to execute `SolverEngine`, inspect rotation heatmaps, lock manual overrides, and export attendance sheets in `/admin/results`.

### 1. Importing Workshops (`Formations & Quotas` -> `Importer CSV`)

- **Endpoint**: `POST /api/v1/formations/import-csv`
- **Format**: **UTF-8 comma-separated CSV** (`.csv`, delimiter `,`; download the exact template directly inside the modal via *Télécharger modèle*).
- **Upsert behavior**: Rows are matched by `code`. If a `code` already exists, the workshop is updated; otherwise a new workshop is created.

| Column (English or French alias) | Required | Default if omitted | Notes |
| :--- | :--- | :--- | :--- |
| `code` | Optional | `FORM-01`, `FORM-02`... | Normalized to uppercase; unique identifier for updates |
| `name` / `nom` | **Yes** | — | Workshop title; rows missing this field are reported as errors |
| `domain` / `domaine` | Optional | `Général` | Category/domain badge |
| `speaker` / `intervenant` | Optional | `""` | Speaker or institution name |
| `room` / `salle` | Optional | `Salle standard` | Room / amphitheater label |
| `levels` / `niveaux` | Optional | `2NDE,1ERE,TERM` | Comma-separated target levels inside double quotes |
| `capacity` / `capacite` | Optional | `20` | Maximum seats per rotation |
| `description` | Optional | `""` | Shown on the student wish-selection cards |

**Example `formations.csv`:**

```csv
code,name,domain,speaker,room,levels,capacity,description
FOR-01,Études de Santé (PASS/L.AS),Santé & Paramédical,Faculté de Médecine,Amphi A,"2NDE,1ERE,TERM",20,Présentation des filières médicales
FOR-02,Classes Préparatoires MPSI/PCSI,Sciences & Ingénierie,CPGE Sciences,Salle B104,"1ERE,TERM",20,Présentation des CPGE scientifiques
FOR-03,Droit & Sciences Politiques,Droit & Sciences Po,Université de Droit,Salle C201,"1ERE,TERM",25,Parcours Licence de Droit et IEP
```

---

### 2. Importing Students (`Élèves & Liens` -> `Importer CSV`)

- **Endpoint**: `POST /api/v1/students/import-csv`
- **Format**: **UTF-8 comma-separated CSV** (`.csv`, delimiter `,`; downloadable template available inside the modal).
- **Behavior**: Each imported student automatically receives a unique cryptographic portal token (`/v/:token`). Any previously unseen `classe` automatically creates a corresponding `ClassGroupConfig` entry (with `AUTO` specialty rotations for `2NDE`, `NONE` for `1ERE` and `TERM`).

| Column (French or English alias) | Required | Default / Auto-inference | Notes |
| :--- | :--- | :--- | :--- |
| `nom` / `last_name` | **Yes** | — | Normalized to uppercase |
| `prenom` / `first_name` | **Yes** | — | Student first name |
| `classe` / `class_name` | **Yes** | — | Class label (e.g., `2nde 2`, `1ère 1`, `Term A`) |
| `niveau` / `level` | Optional | Inferred from `classe` | Recommended values: `2NDE`, `1ERE`, `TERM` |
| `email` | Optional | `null` | Optional student or family email |

> **Level auto-inference**: When `niveau` is omitted, the backend inspects `classe`: strings containing `2` or `SEC` resolve to `2NDE`; `1` or `PREM` resolve to `1ERE`; `TERM` or `T` resolve to `TERM` (fallback: `1ERE`).

**Example `students.csv`:**

```csv
nom,prenom,classe,niveau,email,specialites
DUPONT,Jean,1ère 1,1ERE,jean.dupont@etablissement.fr,NONE
MARTIN,Alice,2nde 2,2NDE,alice.martin@etablissement.fr,"1,2"
BERNARD,Camille,Term A,TERM,camille.bernard@etablissement.fr,NONE
```

---

### 3. Importing Student Wishes (`Élèves & Liens` -> `Importer des vœux (CSV)`)

- **Endpoint**: `POST /api/v1/students/import-wishes-csv`
- **Format**: **UTF-8 comma-separated CSV** matching students by `email` (or `nom,prenom,classe`) and listing ordered workshop codes in `wish_1` through `wish_6` (see [`demo/wishes.csv`](./demo/wishes.csv)).

```csv
email,nom,prenom,classe,wish_1,wish_2,wish_3,wish_4,wish_5,wish_6
jean.dupont@etablissement.fr,DUPONT,Jean,1ère 1,FOR-01,FOR-02,FOR-07,FOR-14,FOR-18,FOR-25
alice.martin@etablissement.fr,MARTIN,Alice,2nde 2,FOR-01,FOR-04,FOR-14,FOR-28,,
```
