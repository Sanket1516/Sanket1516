<!--
  SANKET.SYS — profile v2
  Every visual on this page is a hand-built SVG generated from one design system:
  scripts/design.mjs (tokens) → scripts/build-assets.mjs (static art) → assets/
  scripts/stats.mjs + .github/workflows/profile.yml (live telemetry + snake) → `output` branch
-->

<div align="center">

<a href="https://portfolio.sanketmali.dev"><img src="assets/hero.svg" width="100%" alt="Sanket Mali — Full-Stack Engineer. MERN, AWS Cloud, DevOps, Distributed Systems and AI."></a>

<a href="https://www.linkedin.com/in/sanket-mali-4a40122b7"><img src="assets/link-linkedin.svg" height="40" alt="LinkedIn"></a>
<a href="mailto:sanketmali0909@gmail.com"><img src="assets/link-email.svg" height="40" alt="Email: sanketmali0909@gmail.com"></a>
<a href="https://portfolio.sanketmali.dev"><img src="assets/link-portfolio.svg" height="40" alt="Portfolio: portfolio.sanketmali.dev"></a>
<a href="https://ieeexplore.ieee.org/abstract/document/11400349"><img src="assets/link-paper.svg" height="40" alt="IEEE DELCON 2025 paper"></a>

<br>

<!-- ─────────────────────────────── 01 · whoami ─────────────────────────────── -->

<img src="assets/section-01.svg" width="100%" alt="01 — whoami">

<a href="https://ieeexplore.ieee.org/abstract/document/11400349"><img src="assets/about.svg" width="100%" alt="I engineer full-stack systems and the cloud they run on. B.Tech Computer Science at NMIMS MPSTME (2023–2027), CGPA 3.47 / 4.00. Published at IEEE DELCON 2025. Focus: MERN, AWS, DevOps & distributed systems, AI & automation. Learning: system design, distributed systems, cloud computing."></a>

<br>

<!-- ─────────────────────────────── 02 · work ─────────────────────────────── -->

<img src="assets/section-02.svg" width="100%" alt="02 — Selected work">

<a href="https://github.com/Sanket1516/Smart-Campus-Monitoring-System"><img src="assets/project-smart-campus.svg" width="100%" alt="Smart Campus Entry Monitoring System — MERN platform with biometric terminal sync, Socket.IO live dashboards, RBAC and CI/CD to AWS ECS Fargate."></a>

<a href="https://github.com/Sanket1516/Smart-Form-autofilling"><img src="assets/project-smart-form.svg" width="61.5%" alt="Smart Form Auto-Filling — FastAPI, LangGraph and ChromaDB with a Chrome MV3 extension; fills forms only after user approval."></a><a href="https://github.com/Sanket1516/Packet_analyzer"><img src="assets/project-dpi.svg" width="38.45%" alt="DPI Engine — multi-threaded C++17 deep packet inspection with TLS SNI extraction."></a>

<a href="https://github.com/Sanket1516/metromind-ai-dms"><img src="assets/project-metromind.svg" width="38.45%" alt="MetroMind AI DMS — API gateway in front of 13 FastAPI services: OCR, AI analysis, semantic search, workflows."></a><a href="https://github.com/Sanket1516/Cyber-Sec-Project"><img src="assets/project-passguard.svg" width="61.5%" alt="PassGuard — entropy-based password scoring and live attack simulation over WebSockets."></a>

<a href="https://github.com/Sanket1516/Wanderlust-master"><img src="assets/project-wanderlust.svg" width="100%" alt="Wanderlust — Airbnb-style stay booking platform with Mapbox, Cloudinary, Razorpay and AI helpers."></a>

</div>

<details>
<summary><b>Engineering notes</b> &nbsp;·&nbsp; architecture and implementation details for every project above</summary>
<br>

**[Smart Campus Entry Monitoring System](https://github.com/Sanket1516/Smart-Campus-Monitoring-System)** &nbsp;`React 18` `Vite` `Node.js` `Express` `MongoDB` `Socket.IO` `JWT` `Tailwind` `Chart.js` `Docker` `AWS ECS Fargate`
- Biometric terminals (eSSL X990, ADMS push) post authenticated scan events; SAP ID entry at the gate desk is the manual fallback.
- One scan endpoint decides **entry → exit → re-entry** from each student's state for the day; unknown IDs are logged as unauthorized attempts.
- Hosteller tracking with curfew-violation flags, warden-approved exit windows and live terminal heartbeat.
- RBAC across `admin` · `security` · `warden`; Helmet, rate limiting and request validation on the API.
- Parent notifications by email (Nodemailer) and SMS (Fast2SMS), dispatched fire-and-forget so scans never block.
- Dockerised frontend (Nginx) and backend; GitHub Actions builds to Amazon ECR and rolls out to ECS Fargate behind an ALB.

**[Smart Form Auto-Filling System](https://github.com/Sanket1516/Smart-Form-autofilling)** &nbsp;`FastAPI` `MongoDB` `ChromaDB` `LangGraph` `RapidOCR` `Celery` `Redis` `React 19` `Chrome MV3`
- Extracts facts from the user's own documents with page-level evidence, confidence and origin; conflicts are surfaced for review.
- Deterministic rules run first; an optional LLM (Gemini / OpenAI / Anthropic / Ollama) only fills gaps, and its output is schema-validated.
- "Ask Documents": retrieval over a ChromaDB index with cited sources.
- A Manifest V3 extension detects form fields, recommends values, fills only approved fields, re-reads the DOM to verify, and **never submits**.
- Tested with pytest, Vitest and Playwright.

**[DPI Engine](https://github.com/Sanket1516/Packet_analyzer)** &nbsp;`C++17` `multithreading` `PCAP` `TLS`
- Parses Ethernet → IPv4 → TCP/UDP from PCAP captures and extracts the domain from TLS ClientHello SNI or the HTTP Host header.
- Multi-threaded pipeline: reader → load-balancer threads → fast-path threads → writer, using consistent hashing on the 5-tuple so each flow stays on one thread.
- Rule-based blocking by app, domain or IP; writes filtered PCAPs and a traffic report.

**[MetroMind AI DMS](https://github.com/Sanket1516/metromind-ai-dms)** &nbsp;`FastAPI` `PostgreSQL` `Redis` `FAISS` `ChromaDB` `React` `TypeScript` `Docker` `Prometheus` `Grafana`
- An API gateway in front of independently structured services for auth, documents, OCR, AI/ML, search, notifications, integrations, analytics, tasks, workflows, security, backup and reporting.
- OCR (Tesseract / EasyOCR / OpenCV), Transformer-based analysis, and semantic search on sentence-transformer embeddings.
- WebSocket notifications, JWT and role-based access, and observability through Prometheus and Grafana.

**[PassGuard](https://github.com/Sanket1516/Cyber-Sec-Project)** &nbsp;`Flask-SocketIO` `MongoDB` `React 19` `Recharts` `Tailwind 4` `Framer Motion`
- Entropy scoring (`H = L × log₂(N)`) plus pattern detection for keyboard walks, sequences, dates and leetspeak.
- Dictionary attack against the RockYou dataset (~14M entries), a hybrid attack (~230 mutations per word) and a brute-force estimate, run in that order.
- Progress streams live into per-session Socket.IO rooms, with crack-time estimates for CPU, GPU and GPU-cluster tiers.

**[Wanderlust](https://github.com/Sanket1516/Wanderlust-master)** &nbsp;`Node.js` `Express` `MongoDB` `EJS` `Passport` `Cloudinary` `Mapbox` `Razorpay` `Nodemailer`
- An MVC monolith covering listings, search, filters, pagination, wishlists, bookings, reviews, host–guest messaging and an admin dashboard.
- Razorpay order creation with payment verification; Mapbox geocoding; Cloudinary image uploads.
- AI-generated listing descriptions, review summaries and a listing-aware travel chatbot (Cohere, Groq).

**Also shipped:** an employee directory deployed on AWS (EC2, ALB, Auto Scaling, IAM, S3, DynamoDB, VPC), and a quiz portal built during my Technook internship (JavaScript, Hyperlambda, MySQL).

</details>

<div align="center">

<br>

<!-- ─────────────────────────────── 03 · stack ─────────────────────────────── -->

<img src="assets/section-03.svg" width="100%" alt="03 — Technology ecosystem">

<img src="assets/stack.svg" width="100%" alt="Languages: C++, Python, JavaScript, TypeScript, Java, SQL. Frontend: React, Vite, Tailwind, Material UI, Bootstrap, EJS, Chart.js. Backend: Node.js, Express, FastAPI, Flask, Socket.IO, JWT, Passport. Databases: MongoDB, PostgreSQL, MySQL, Redis, PL/SQL, ChromaDB. Cloud: AWS, Fargate, ECS/ECR, EC2, S3, DynamoDB, IAM, Linux. DevOps: GitHub Actions, Docker, Nginx, Prometheus, Grafana, Celery. AI/ML: LangGraph, Transformers, embeddings, OpenCV, spaCy, Gemini. Tools: Git, GitHub, Bash, pytest, Vitest, Playwright, Wireshark, Power BI.">

<br>

<!-- ─────────────────────────────── 04 · telemetry ─────────────────────────────── -->

<img src="assets/section-04.svg" width="100%" alt="04 — Telemetry">

<img src="https://raw.githubusercontent.com/Sanket1516/Sanket1516/output/stats.svg" width="100%" alt="Live GitHub telemetry: contributions, streaks, stars, followers, repositories, languages, contribution calendar and weekly activity. Rebuilt every 12 hours by GitHub Actions.">

<br>

<!-- ─────────────────────────────── 05 · snake ─────────────────────────────── -->

<img src="assets/section-05.svg" width="100%" alt="05 — Signal trace">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sanket1516/Sanket1516/output/snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Sanket1516/Sanket1516/output/snake-light.svg">
  <img src="https://raw.githubusercontent.com/Sanket1516/Sanket1516/output/snake-dark.svg" width="100%" alt="Animated snake eating the contribution graph">
</picture>

<br><br>

<img src="assets/divider.svg" width="100%" alt="">

<a href="https://portfolio.sanketmali.dev"><img src="assets/footer.svg" width="100%" alt="Signed — Sanket Mali. Thanks for stopping by."></a>

<img src="https://komarev.com/ghpvc/?username=Sanket1516&label=VISITORS&color=8B5CF6&style=flat-square&abbreviated=true" alt="Profile visitors">

</div>

<details>
<summary><sub><b>How this profile is built</b> · no templates, no third-party stat cards</sub></summary>
<br>

| Layer | What it does |
|---|---|
| [`scripts/design.mjs`](scripts/design.mjs) | The **SIGNAL** design system as code: palette, type scale, card borders with registration ticks, motion tempo, packet and LED primitives. |
| [`scripts/build-assets.mjs`](scripts/build-assets.mjs) | Generates every static SVG in [`assets/`](assets): hero, bento cards, architecture diagrams and the tech map. Icons from `simple-icons` are inlined. |
| [`scripts/stats.mjs`](scripts/stats.mjs) | Queries the GitHub GraphQL API and renders the telemetry dashboard: streaks, calendar, languages and weekly activity. |
| [`profile.yml`](.github/workflows/profile.yml) | Every 12 hours, renders the dashboard and the snake, validates them, and publishes them to the `output` branch. A failed run publishes nothing, so the last good images stay up. |

Animation is pure SVG and SMIL (no JavaScript), so it renders inside GitHub's image sandbox. Rebuild locally with `npm install && npm run build`.

</details>
