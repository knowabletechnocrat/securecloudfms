# Secure Cloud File Management System
Local-only project: React/Vite and Node/Express run on Windows; MySQL runs on your existing MySQL80 service; SeaweedFS S3-compatible object storage runs in Docker.

## Start
1. Execute `database/schema.sql` in MySQL Workbench.
2. From project root: `docker compose -f docker/docker-compose.yml up -d`
3. Backend: `cd backend`; `Copy-Item .env.example .env`; edit `.env`; `npm install`; `npm run dev`
4. Frontend in another terminal: `cd frontend`; `Copy-Item .env.example .env`; `npm install`; `npm run dev`
5. Open http://localhost:5173. Backend health: http://localhost:5000/api/health.

Register an account, then optionally promote it to admin:
`UPDATE secure_drive.users SET role_id=(SELECT id FROM secure_drive.roles WHERE name='admin') WHERE email='your-email@example.com';`
Log out and back in to refresh role in the session.

This is a learning/development starter, not production-hardened. Express memory sessions are development-only. Do not expose MySQL or SeaweedFS ports to the internet. Add persistent sessions, CSRF protection, HTTPS, backups, malware scanning and hardened credentials before production use.
