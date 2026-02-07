# 🤖 Agente IA Ambro — MVP

Chat inteligente para consulta de dados de pedidos e-commerce.

**Projeto Átrio — Derivado MVP** | Versão 1.0

---

## 📋 Visão Geral

O Agente IA Ambro é um chatbot que permite ao gestor da empresa Ambro consultar dados de pedidos e-commerce usando linguagem natural. O sistema utiliza Google Gemini 2.5 Flash com abordagem híbrida (Function Calling + Text-to-SQL) para responder perguntas como:

- "Quantos pedidos pagos em dezembro/2025?"
- "Valor total de vendas do Bagy?"
- "Média de ticket dos últimos 90 dias?"

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│  VPS Locaweb (São Paulo) — Easypanel + Docker   │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │   Frontend    │    │      Backend API       │ │
│  │  React+Vite   │───▶│  Node.js + Express     │ │
│  │  (Nginx)      │    │  TypeScript            │ │
│  └──────────────┘    └──────────┬─────────────┘ │
│                                  │               │
└──────────────────────────────────┼───────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
           ┌──────────────┐             ┌──────────────┐
           │   Supabase    │             │ Google Gemini │
           │  (Free Tier)  │             │  2.5 Flash    │
           │  PostgreSQL   │             │  Function     │
           │  39.943 orders│             │  Calling      │
           └──────────────┘             └──────────────┘
```

## 🚀 Quick Start (Desenvolvimento Local)

### Pré-requisitos
- Node.js 22 LTS
- Docker + Docker Compose (opcional)
- Conta Supabase (Free Tier)
- API Key do Google Gemini

### 1. Clone e instale

```bash
git clone <repo-url>
cd ambro-mvp

# Backend
cd backend
cp .env.example .env  # Configure suas variáveis
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure variáveis de ambiente

**Backend (.env):**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AI...
JWT_SECRET=seu-secret-seguro-aqui
AUTH_USER=khelven
AUTH_PASSWORD=$2b$10$...  # bcrypt hash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001
```

### 3. Rode localmente

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Acesse: http://localhost:5173

### 4. Docker Compose (alternativa)

```bash
docker compose up --build
```

## 📁 Estrutura do Projeto

```
ambro-mvp/
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas (Login, Chat)
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks
│   │   └── styles/          # CSS global
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/          # Endpoints da API
│   │   ├── services/        # Lógica de negócio
│   │   ├── middleware/       # Auth, rate limit, etc.
│   │   ├── config/          # Configurações
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilitários
│   └── Dockerfile
├── docker-compose.yml       # Orquestração local
└── README.md
```

## 🔐 Credenciais (MVP)

Para gerar o hash bcrypt da senha:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua-senha', 10).then(h => console.log(h))"
```

## 📦 Deploy (Easypanel)

1. Configure o projeto `ambro-mvp` no Easypanel
2. Conecte o repositório GitHub
3. Crie 2 apps: `ambro-frontend` e `ambro-backend`
4. Configure variáveis de ambiente no painel
5. Push para `main` → deploy automático

## 📄 Licença

Confidencial — Projeto Átrio / Agregar Negócios
