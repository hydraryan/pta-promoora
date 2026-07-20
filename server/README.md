# PTA Backend (MongoDB + Gmail SMTP)

Standalone Node/Express backend for the Promoora Talent Accelerator app. It:
- Accepts an application (multipart with resume PDF) at `POST /api/apply`
- Stores the applicant in MongoDB (`applications` collection)
- Auto-creates a `users` record with a generated 12-char password (bcrypt-hashed)
- Emails the applicant via Gmail SMTP (application received + credentials)

## Setup

```bash
cd server
cp .env.example .env    # fill in MongoDB URI + Gmail SMTP
npm install
npm run dev
```

Server runs on `http://localhost:4000`.

### Gmail SMTP
Enable 2-Step Verification on the Gmail account, then create an **App Password**
at https://myaccount.google.com/apppasswords and paste it as `SMTP_PASS`.

### MongoDB
Use your Atlas connection string. **Rotate the password you shared earlier** —
treat it as leaked.

## Frontend wiring

Set `VITE_API_URL=http://localhost:4000` in the frontend `.env`. The apply form
POSTs `multipart/form-data` to `${VITE_API_URL}/api/apply`.

## Endpoints

- `GET  /health` — health check
- `POST /api/apply` — multipart form fields + `resume` file. Returns
  `{ id, account_created, email_sent }`.

## Notes

- Resumes are stored on local disk under `./uploads`. Swap for S3/GCS/Cloudinary in production.
- Rate limit: 5 submissions/hour per IP.
- Passwords are generated with `crypto.randomBytes` (≈71 bits entropy) and stored as bcrypt hashes only.
