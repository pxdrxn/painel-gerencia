# 🏢 S.O.S Crédito — Painel de Gerência Operacional

Sistema interno moderno para gestão operacional da S.O.S Crédito.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Next.js](https://img.shields.io/badge/Next.js-14-000000)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)

---

## 📋 Visão Geral

Painel operacional interno para monitoramento e gestão de:

- 👥 **Funcionários** — CRUD completo com histórico
- 🏪 **Unidades/Lojas** — Mapeamento de 10 unidades
- 🏖️ **Férias** — Calendário com detecção de conflitos
- 📊 **Disponibilidade** — Monitoramento operacional em tempo real
- 📈 **Produção** — Métricas mensais e ranking
- 🎯 **Metas** — Controle por unidade
- 📉 **Retenção** — Análise de tempo de empresa
- 🖥️ **Dashboard** — Painel de controle unificado

---

## 🏗️ Arquitetura

```
painel-gerencia/
├── backend/          → FastAPI API (Python 3.12)
├── frontend/         → Next.js 14 (TypeScript)
└── docker-compose.yml
```

### Stack

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | FastAPI + SQLAlchemy 2.0 (async) |
| **Banco** | PostgreSQL 16 (Neon em produção) |
| **Auth** | JWT (access + refresh tokens) |
| **Frontend** | Next.js 14 + TailwindCSS |
| **Deploy** | Render (API) + Vercel (frontend) |

### Padrão Arquitetural

```
Router → Service → Repository → Database
```

- **Router**: HTTP handling + Pydantic validation + RBAC
- **Service**: Business logic + orchestration
- **Repository**: Database queries + pagination

---

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para o frontend)
- Python 3.12+ (para desenvolvimento sem Docker)

### Desenvolvimento Local

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd painel-gerencia

# 2. Copiar variáveis de ambiente
cp backend/.env.example backend/.env

# 3. Subir backend + banco com Docker
docker compose up -d

# 4. Aplicar migrações
docker compose exec backend alembic upgrade head

# 5. Criar primeiro admin
docker compose exec backend python -m scripts.create_admin

# 6. Acessar API docs
open http://localhost:8000/api/docs

# 7. Subir frontend (em outro terminal)
cd frontend
npm install
npm run dev

# 8. Acessar o painel
open http://localhost:3000
```

---

## 🔐 Autenticação

O sistema usa **JWT** com 3 níveis de acesso:

| Role | Acesso |
|------|--------|
| `admin` | Acesso total ao sistema |
| `supervisor` | Gestão de equipe + relatórios |
| `operacional` | Somente leitura + registro de produção |

---

## 📡 API Endpoints

| Módulo | Base Path | Métodos |
|--------|-----------|---------|
| Auth | `/api/auth` | login, logout, refresh, me |
| Users | `/api/users` | CRUD (admin only) |
| Employees | `/api/employees` | CRUD + search + history |
| Units | `/api/units` | CRUD + availability |
| Vacations | `/api/vacations` | CRUD + complete |
| Availability | `/api/availability` | GET (read-only) |
| Production | `/api/production` | CRUD + ranking + comparison |
| Goals | `/api/goals` | CRUD |
| Retention | `/api/retention` | GET (read-only) |
| Dashboard | `/api/dashboard` | GET metrics |

Documentação interativa: `http://localhost:8000/api/docs`

---

## 🚢 Deploy

### Backend → Render

1. Conectar repositório ao Render
2. Usar o `render.yaml` como Blueprint
3. Configurar `DATABASE_URL` com Neon PostgreSQL
4. Deploy automático via push

### Frontend → Vercel

1. Conectar repositório ao Vercel
2. Root directory: `frontend/`
3. Framework: Next.js
4. Configurar variáveis de ambiente
5. Deploy automático via push

### Banco → Neon PostgreSQL

1. Criar projeto no Neon
2. Copiar connection string (pooler endpoint)
3. Configurar no Render como `DATABASE_URL`

---

## 📁 Estrutura do Backend

```
backend/app/
├── core/           → Config, Security, Permissions, Exceptions
├── database/       → Base models, Session, Repository genérico
├── middleware/      → Audit logging, Error handling
├── modules/        → Domínios de negócio
│   ├── auth/       → JWT authentication
│   ├── users/      → User management
│   ├── employees/  → Employee CRUD
│   ├── units/      → Store management
│   ├── vacations/  → Vacation calendar
│   ├── availability/ → Operational availability
│   ├── production/ → Monthly production
│   ├── retention/  → Employee retention
│   ├── goals/      → Unit goals
│   └── dashboard/  → Unified metrics
├── background/     → BackgroundTasks (availability, vacations)
└── main.py         → FastAPI application factory
```

---

## 📝 Licença

Projeto interno — S.O.S Crédito © 2024-2026
