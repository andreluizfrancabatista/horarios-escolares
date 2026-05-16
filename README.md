# 📅 Horários Escolares

Sistema web de **gestão de horários para ensino superior** — construído com React + FastAPI + PostgreSQL, empacotado em Docker Compose para deploy simplificado.

---

## ✨ Funcionalidades

### v1.0 — Interface de Gestão (atual)
- [x] Login com autenticação JWT (perfil admin)
- [x] Gestão de **Semestres** (ativar semestre letivo ativo)
- [x] Gestão de **Cursos** (código, nome, turno)
- [x] Gestão de **Disciplinas** (vinculadas a cursos, com período e carga horária)
- [x] Gestão de **Professores** (titulação, departamento, e-mail)
- [x] Gestão de **Salas** (tipo, bloco, capacidade)
- [x] **Grade de Horários** — construção manual com visualização por turma, professor ou sala
- [x] Detecção automática de conflitos (professor, sala, turma no mesmo slot)

### v2.0 — Alocação Automática (planejado)
- [ ] Integração com OR-Tools (Python) via backend
- [ ] Cadastro de restrições de professores (disponibilidade por dia/horário)
- [ ] Geração automática da grade a partir das restrições
- [ ] Comparação entre grade manual e grade gerada automaticamente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   nginx :80                      │
│         (proxy reverso + servir frontend)        │
└──────────────┬──────────────────┬───────────────┘
               │ /api/*           │ /*
    ┌──────────▼──────┐   ┌───────▼───────┐
    │  FastAPI :8000  │   │  React (Nginx)│
    │   (backend)     │   │  (frontend)   │
    └──────────┬──────┘   └───────────────┘
               │
    ┌──────────▼──────┐
    │  PostgreSQL :5432│
    │    (database)    │
    └──────────────────┘
```

**Stack:**
| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + React Router + TanStack Query + Zustand |
| Backend | FastAPI + SQLAlchemy 2 + Alembic |
| Banco de dados | PostgreSQL 16 |
| Autenticação | JWT (python-jose + passlib/bcrypt) |
| Proxy | Nginx Alpine |
| Containers | Docker + Docker Compose |

---

## 🗃️ Modelo de Dados

```
Semestre
  └── Horario (semestre_id)
        ├── Curso
        ├── Disciplina → Curso
        ├── Professor
        └── Sala

Restrições de unicidade no banco:
  • professor + dia + horário_início + semestre  (sem conflito de professor)
  • sala      + dia + horário_início + semestre  (sem conflito de sala)
  • curso     + dia + horário_início + semestre  (sem conflito de turma)
```

---

## 🚀 Como rodar

### Pré-requisitos
- Docker ≥ 24
- Docker Compose ≥ 2.20

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/horarios-escolares.git
cd horarios-escolares
```

### 2. Configure o ambiente
```bash
cp .env.example .env
# Edite o .env com suas senhas e configurações
```

### 3. Suba a aplicação
```bash
docker compose up -d --build
```

### 4. Acesse
- **Aplicação:** http://localhost:8080
- **API Docs (Swagger):** http://localhost:8080/docs

**Login padrão** (altere no `.env` antes de subir em produção):
- Email: `admin@escola.edu.br`
- Senha: `admin123`

---

## 🖥️ Deploy em VPS

### Convivendo com outras aplicações

O projeto usa uma rede Docker isolada (`horarios_net`) e expõe apenas a porta definida em `APP_PORT` (padrão: `8080`). Para integrar com outras aplicações no mesmo servidor:

**Opção A — Nginx externo como proxy (recomendado)**

Se a VPS já tem um nginx/Caddy externo gerenciando HTTPS, mude `APP_PORT` para uma porta interna (ex: `8082`) e configure o proxy externo:

```nginx
# /etc/nginx/sites-available/horarios
server {
    listen 443 ssl;
    server_name horarios.suaescola.edu.br;

    ssl_certificate /etc/letsencrypt/live/horarios.suaescola.edu.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/horarios.suaescola.edu.br/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

**Opção B — Rede Docker compartilhada**

Se outras aplicações também rodam em Docker e você usa um proxy reverso conteinerizado (Traefik, nginx-proxy):

```yaml
# No docker-compose.yml, adicione à rede externa:
networks:
  horarios_net:
    driver: bridge
  proxy_net:          # rede do seu proxy externo
    external: true
```

### Atualizar a aplicação
```bash
git pull
docker compose up -d --build
```

### Backup do banco de dados
```bash
docker compose exec db pg_dump -U horarios horarios_db > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
cat backup_20250101.sql | docker compose exec -T db psql -U horarios horarios_db
```

---

## 🔧 Desenvolvimento local

### Backend (sem Docker)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Configure DATABASE_URL no .env apontando para um Postgres local
uvicorn app.main:app --reload
```

### Frontend (sem Docker)
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000 — proxy /api → localhost:8000
```

---

## 📁 Estrutura do projeto

```
horarios-escolares/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core/           # config, security (JWT)
│       ├── db/             # session, base, init_db
│       ├── models/         # SQLAlchemy models
│       ├── schemas/        # Pydantic schemas
│       ├── api/routes/     # FastAPI routers
│       └── services/       # (reservado para lógica de negócio)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css       # design system (CSS variables)
        ├── components/
        │   └── layout/
        ├── pages/          # HorariosPage, CursosPage, etc.
        ├── services/       # api.js (axios + todos os endpoints)
        └── store/          # authStore, semestreStore (Zustand)
```

---

## 🛣️ Roadmap

| Versão | Funcionalidade |
|--------|---------------|
| **v1.0** | Interface de gestão manual (atual) |
| **v1.1** | Dashboard com estatísticas do semestre |
| **v1.2** | Exportação da grade (PDF / Excel) |
| **v2.0** | Alocação automática com OR-Tools |
| **v2.1** | Restrições de disponibilidade por professor |
| **v2.2** | Comparação manual × automático |

---

## 📄 Licença

MIT — use, modifique e distribua livremente.
