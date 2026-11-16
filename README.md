# Invoice_NodeJs-

REST backend for an invoicing app: users, clients, products, estimates and invoices, with server-rendered PDFs. It is the API behind the [invoice_manager](https://github.com/nishank23/invoice_manager) Flutter app.

## What it does

- **Accounts.** Email sign-up with a verification link, Google sign-in, password reset by email. JWT on every protected route.
- **Clients and products.** CRUD with profile and product image uploads.
- **Estimates and invoices.** Auto-incrementing numbers per user, line items, signature upload, HTML preview and A4 PDF download rendered with Puppeteer.
- **Dashboard.** Weekly client and invoice counts for the signed-in user, with week-over-week change.
- **Address data.** Country, state and city lists for address forms, imported from CSV files in `data/`.

## Stack

Node.js 22, Express, MongoDB with Mongoose, JWT, EJS templates, Puppeteer, Nodemailer, Firebase Admin. Helmet, CORS allow-list and rate limiting are on by default.

## Run it locally

```bash
cp config.env.example config.env   # MongoDB URI, JWT secret, Gmail app password, base URL
npm install
npm run dev
```

To load the address data, uncomment `importData()` in `index.js` for one start.

Firebase Admin needs a service account: put it at `src/config/serviceAccountKey.json` or set `FIREBASE_SERVICE_ACCOUNT` to its JSON. Both are gitignored.

## API

All routes are under `/api/v1` and need `Authorization: Bearer <token>`, except sign-in, sign-up and the location lists.

| Area | Routes |
|---|---|
| Auth | `POST /signup/email`, `/signin/email`, `/signup/google`, `/signin/google`, `/forgotpassword`, `/resetpassword/:token` |
| Profile | `GET`/`POST /user-profile`, `POST /user-profile/upload` |
| Clients | `GET /clients`, `GET`/`DELETE /clients/:clientId`, `POST /clients/:clientId?` |
| Products | `GET`/`POST /products`, `GET /products/:id` |
| Estimates | `POST /create-est`, `GET /allest`, `GET /curr-est`, `GET /estpreview/:id`, `GET`/`POST`/`DELETE /est/:id` |
| Invoices | `POST /create-inv`, `GET /allinv`, `GET /curr-inv`, `GET /invpreview/:id`, `GET`/`POST`/`DELETE /inv/:id` |
| Location | `GET /countries`, `/states/:countryId`, `/cities/:stateId` |

## Project structure

```text
index.js          starts the server, connects MongoDB, optional CSV import
app.js            middleware and route mounting
src/routes/       one router per area
src/controllers/  request handlers, PDF rendering
src/models/       Mongoose schemas
src/helpers/      JWT, uploads, password hashing, input sanitizing
views/            EJS invoice and estimate templates
data/             countries, states, cities CSV
```

## Security

Credentials were committed to this repo in the past and are still in its git history. [SECURITY.md](SECURITY.md) lists what must be rotated.
