# Vócali — Plataforma de Transcripción de Audio

Vócali es una plataforma cloud que permite a usuarios registrados transcribir audio, tanto desde ficheros pregrabados como en tiempo real a través del micrófono. Construida sobre AWS con arquitectura serverless.

---

## Índice

- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Requisitos Previos](#requisitos-previos)
- [Configuración](#configuración)
- [Desarrollo Local](#desarrollo-local)
- [Tests](#tests)
- [Despliegue](#despliegue)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Usuario                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Nuxt.js    │  Frontend (SPA)
                    │  Frontend   │
                    └──────┬──────┘
                           │ HTTPS / WSS
          ┌────────────────┼──────────────────┐
          │                │                  │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
   │  API Gateway │  │ API Gateway │  │  AssemblyAI  │
   │    (HTTP)    │  │  (WebSocket)│  │  Streaming   │
   └──────┬──────┘  └──────┬──────┘  └──────────────┘
          │                │
   ┌──────▼──────────────────────────────────────────┐
   │                  AWS Lambda                      │
   │  register | login | confirm | getAiToken         │
   │  getPresignedUrl | list | download | saveLive    │
   │  processAudio | wsConnect | wsDisconnect         │
   └──────┬──────────────────────┬───────────────────┘
          │                      │
   ┌──────▼──────┐        ┌──────▼──────┐
   │  DynamoDB   │        │    AWS S3   │
   │Transcriptions│        │ Audio Files │
   │ Connections │        └─────────────┘
   └─────────────┘
          │
   ┌──────▼──────┐
   │ AWS Cognito │
   │  User Pool  │
   └─────────────┘
```

**Flujo de transcripción de fichero:**
1. El usuario solicita una URL pre-firmada de S3 → Lambda `getPresignedUrl`
2. El frontend sube el audio directamente a S3 (sin pasar por Lambda)
3. S3 dispara un evento → Lambda `processAudio`
4. `processAudio` envía el audio a AssemblyAI y guarda el resultado en DynamoDB

**Flujo de transcripción en tiempo real:**
1. El frontend solicita un token temporal a AssemblyAI → Lambda `getAiToken`
2. El frontend abre un WebSocket directo con AssemblyAI Streaming
3. El audio del micrófono fluye como PCM16 en tiempo real
4. Al terminar, el usuario guarda el texto → Lambda `saveLive` → DynamoDB

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Nuxt.js 4, Vue 3, TypeScript, Tailwind CSS v4 |
| **Backend** | Node.js 20, TypeScript, AWS Lambda |
| **IaC** | Serverless Framework v4 (esbuild) |
| **Base de datos** | AWS DynamoDB |
| **Almacenamiento** | AWS S3 |
| **Autenticación** | AWS Cognito |
| **Transcripción** | AssemblyAI (Streaming v3 + async) |
| **Tests backend** | Jest + ts-jest |
| **Tests E2E** | Cypress |

---

## Funcionalidades

- 🔐 **Registro y autenticación** — via AWS Cognito
- 📁 **Transcripción de ficheros** — MP3, WAV, M4A hasta 20 MB
- 🎙️ **Transcripción en tiempo real** — WebSocket + micrófono del navegador
- 📋 **Historial paginado** — 10 elementos por página con scroll infinito
- ⬇️ **Descarga de transcripciones** — exporta cualquier transcripción como `.txt`
- 🚪 **Cierre de sesión** — limpieza de cookies segura

---

## Requisitos Previos

- **Node.js** >= 20
- **npm** >= 10
- **AWS CLI** configurado con credenciales válidas (`aws configure`)
- **Serverless Framework** v4: `npm install -g serverless`
- Cuenta en [AssemblyAI](https://www.assemblyai.com/) (capa gratuita disponible)
- Cuenta en AWS con permisos sobre: Lambda, API Gateway, DynamoDB, S3, Cognito

---

## Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/invox-transcription-test.git
cd invox-transcription-test
```

### 2. Configurar variables de entorno

**Backend:**
```bash
cd backend
cp .env.example .env
# Edita .env con tus valores reales
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edita .env con las URLs de tu API Gateway desplegada
```

### 3. Instalar dependencias

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

## Desarrollo Local

### Arrancar el frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

El frontend en modo SPA (sin SSR). Las llamadas a la API van contra el backend desplegado en AWS (configura `NUXT_PUBLIC_API_URL` en `frontend/.env`).

### Desplegar el backend en AWS (necesario para desarrollo)

```bash
cd backend
# Asegúrate de tener el .env con los secretos
export $(cat .env | xargs)
npx serverless deploy --stage dev
```

Tras el despliegue, Serverless imprimirá las URLs del API Gateway. Cópialas en `frontend/.env`.

---

## Tests

### Backend — Tests unitarios (Jest)

```bash
cd backend
npm test
```

Con cobertura:
```bash
npm run test:coverage
```

### Frontend — Tests E2E (Cypress)

```bash
cd frontend

# Modo interactivo (UI de Cypress)
npx cypress open

# Modo headless (para CI)
npx cypress run
```

> Los tests E2E requieren que el frontend esté corriendo en `http://localhost:3000`.

---

## Despliegue

### Backend a AWS

```bash
cd backend

# Configura los secretos como variables de entorno o en un .env
export COGNITO_USER_POOL_ID=eu-west-1_XXXXXXXXX
export COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
export ASSEMBLYAI_API_KEY=your_key

npx serverless deploy --stage prod
```

### Frontend

El frontend se genera como una SPA estática:

```bash
cd frontend
npm run generate
# Output en .output/public — listo para subir a Cloudflare Pages, Vercel, etc.
```

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|---|---|
| `COGNITO_USER_POOL_ID` | ID del User Pool de AWS Cognito |
| `COGNITO_CLIENT_ID` | Client ID de la app de Cognito |
| `ASSEMBLYAI_API_KEY` | API Key de AssemblyAI |

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `NUXT_PUBLIC_API_URL` | URL base del API Gateway HTTP |
| `NUXT_PUBLIC_WS_URL` | URL del API Gateway WebSocket |

---

## Estructura del Proyecto

```
invox-transcription-test/
├── backend/
│   ├── src/
│   │   └── functions/
│   │       ├── auth/
│   │       │   ├── register.ts       # POST /auth/register
│   │       │   ├── confirm.ts        # POST /auth/confirm
│   │       │   ├── login.ts          # POST /auth/login
│   │       │   ├── logout.ts
│   │       │   └── getAiToken.ts     # GET  /auth/ai-token
│   │       ├── transcriptions/
│   │       │   ├── getPresignedUrl.ts # POST /transcriptions/presigned-url
│   │       │   ├── processAudio.ts   # S3 trigger → AssemblyAI
│   │       │   ├── list.ts           # GET  /transcriptions
│   │       │   ├── download.ts       # GET  /transcriptions/{id}/download
│   │       │   └── saveLive.ts       # POST /transcriptions/live
│   │       └── websockets/
│   │           ├── connect.ts        # WS $connect
│   │           └── disconnect.ts     # WS $disconnect
│   ├── tests/
│   │   └── sample.test.ts
│   ├── serverless.yml                # Infraestructura como código (IaC)
│   ├── jest.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── pages/
│   │   ├── index.vue                 # Dashboard principal
│   │   ├── login.vue
│   │   ├── register.vue
│   │   └── confirm.vue
│   ├── components/
│   │   ├── AudioUpload.vue           # Subida de ficheros de audio
│   │   ├── RealTimeRecorder.vue      # Grabación en tiempo real
│   │   └── TranscriptionHistory.vue  # Historial paginado
│   ├── composables/
│   │   └── useApi.ts                 # Wrapper de fetch con auth
│   ├── assets/css/
│   │   └── main.css                  # Tailwind + tema de marca
│   ├── cypress/e2e/
│   │   └── spec.cy.ts                # Tests E2E
│   ├── nuxt.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Licencia

Proyecto de evaluación técnica — Vócali.
