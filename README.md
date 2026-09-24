# Express TS Starter

Reusable Express + TypeScript backend starter with JWT authentication (access/refresh tokens, token revocation), Google OAuth, MongoDB/Mongoose, email verification & OTP flows, AWS S3 file uploads (pre-signed URLs), Zod validation, and role-based authorization.

## Features

- 🔐 **Authentication**: email/password signup & login, Google OAuth sign-in/sign-up
- 🎫 **JWT access/refresh tokens**: per-role signatures (user vs. system/admin) and token revocation through a stored token model
- 📧 **Email verification & OTP**: email confirmation on signup and a forgot-password flow, sent with Nodemailer
- 🛡️ **Role-based authorization**: `authentication` (verify identity) and authorization (verify role) middlewares
- 📁 **File uploads**: Multer + AWS S3 with pre-signed URLs
- ✅ **Request validation**: Zod schemas per route (body/params/query)
- 🧱 **Repository pattern**: a generic `DatabaseRepository` extended by `UserRepository` and `TokenRepository`
- 🚦 **Security**: bcrypt password hashing and environment-based secrets

## Tech Stack

Node.js · Express 5 · TypeScript · MongoDB / Mongoose · JWT · Zod · Multer · AWS S3 · Nodemailer · bcrypt · google-auth-library

## Project Structure

```
config/
├── .env.development          # local env (git-ignored)
└── .env.example              # env template
src/
├── app.controller.ts         # Express app setup, middleware, route mounting
├── index.ts                  # Entry point
├── DB/
│   ├── connection.db.ts
│   ├── models/               # User, Token
│   └── repository/           # database, user, token repositories
├── middleware/
│   ├── authentication.middleware.ts
│   └── validation.middleware.ts
├── modules/
│   ├── auth/                 # controller, service, dto, validation, entities
│   └── user/                 # controller, service, dto, validation, authorization
└── utils/
    ├── otp.ts
    ├── email/                # nodemailer, templates, event-driven sending
    ├── multer/               # multer config, S3 config & events
    ├── response/             # success & error responses
    ├── security/             # hashing, JWT helpers
    └── types/                # Express Request augmentation
```

## Getting Started

### Prerequisites

- Node.js >= 20
- A running MongoDB instance

### Installation

```bash
git clone https://github.com/USERNAME/Express-Ts-Starter.git
cd Express-Ts-Starter
npm install
```

### Environment Variables

Copy the example file and fill in your own values:

```bash
cp config/.env.example config/.env.development
```

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `MOOD` | Environment mode (`development` / `production`) |
| `APPLICATION_NAME` | App name (used in emails) |
| `DB_URI` | MongoDB connection string |
| `EMAIL` / `EMAIL_PASSWORD` | Gmail account and App Password used to send emails |
| `SALT` | bcrypt salt rounds |
| `ACCESS_USER_TOKEN_SIGNATURE` / `ACCESS_SYSTEM_TOKEN_SIGNATURE` | JWT access token secrets (user vs. system) |
| `REFRESH_USER_TOKEN_SIGNATURE` / `REFRESH_SYSTEM_TOKEN_SIGNATURE` | JWT refresh token secrets |
| `ACCESS_TOKEN_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | Token lifetimes, in seconds |
| `WEB_CLIENT_ID` | Google OAuth client ID |
| `AWS_REGION` / `AWS_BUCKET_NAME` | S3 region and bucket |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS` | Pre-signed URL lifetime |

### Run

```bash
npm run start:dev   # development (tsc --watch + node --watch)
npm run build       # compile TypeScript to dist/
npm start           # run the compiled build (production)
```

The server starts on `http://localhost:<PORT>`.

## API Endpoints

### Auth: `/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register with email & password |
| PATCH | `/auth/confirm-email` | Confirm email with OTP |
| POST | `/auth/signup/gmail` | Sign up via Google |
| POST | `/auth/login` | Login with email & password |
| POST | `/auth/login/gmail` | Login via Google |
| PATCH | `/auth/send-forgot-password` | Send a password-reset OTP |
| PATCH | `/auth/verify-forgot-password` | Verify the reset OTP |
| PATCH | `/auth/reset-forgot-password` | Set a new password |

### User: `/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/user` | required | Get own profile |
| GET | `/user/refresh-token` | refresh token | Issue a new token pair |
| PATCH | `/user/profile-image` | required | Upload profile image |
| POST | `/user/logout` | required | Logout / revoke token |

## Roadmap

- [ ] Rate limiting
- [ ] Docker support
- [ ] Logging
- [ ] Tests

## License

ISC
