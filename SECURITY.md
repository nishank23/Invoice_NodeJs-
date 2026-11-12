# Security

## Reporting

If you find a vulnerability, please open a private security advisory on GitHub
rather than a public issue.

## Secrets

This repository previously committed credentials (Firebase service account,
MongoDB connection string, Gmail app passwords, JWT secret). Those values are
still present in the git history and **must be treated as compromised**.

They are no longer read from source: all configuration now comes from
`config.env` (gitignored) and `src/config/serviceAccountKey.json` (gitignored).
See `config.env.example` for the required keys.

### Required rotation checklist

Rotate each item at its provider; updating `config.env` alone is not enough.

1. **Firebase service account**
   - Firebase console → Project settings → Service accounts → delete the old key
     (`private_key_id` `bf16de28...`) and generate a new one.
   - Save it as `src/config/serviceAccountKey.json`, or set
     `FIREBASE_SERVICE_ACCOUNT` to its JSON contents.
2. **MongoDB password**
   - MongoDB Atlas → Database Access → edit the `myadmin` user → set a new
     password.
   - Update `MONGO_URI` in `config.env`.
3. **Gmail app passwords**
   - Google Account → Security → App passwords → revoke all existing app
     passwords (three were exposed).
   - Create a new one and update `GMAIL_APP_PASSWORD`.
4. **JWT secret**
   - Generate a new value (`openssl rand -hex 32`) and set `JWT_SECRET_KEY`.
   - Rotating it invalidates every existing token, which forces re-login.
5. **Deployment host**
   - Set `BASE_URL` to the public URL so verification/reset emails link to the
     right host.

### Repository hygiene

- `config.env`, `.env`, `src/config/serviceAccountKey.json` and
  `src/config/firebaseConfig.json` are gitignored.
- Run `git status` before committing and confirm no credentials appear.
- If you need to purge secrets from history, use `git filter-repo` (or BFG)
  followed by a force push. This rewrites history for all clones — coordinate
  before doing it, and rotate the secrets regardless.
