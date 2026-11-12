# 🧾 Invoice Generator – Node.js Backend

A RESTful backend service for managing clients, products, and invoices.  
Built using Node.js, Express, and MongoDB. This backend powers a Flutter-based invoice generator application.

---

## 🚀 Features

- 🔐 JWT-based user authentication
- 👤 Client management (Create, Read, Update, Delete)
- 🛍 Product / service management
- 🧾 Invoice creation & tracking
- 📊 Basic invoice analytics
- 🔎 Pagination & filtering support
- 🛡 Protected routes with middleware

---

## 🛠 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **EJS** (for invoice preview views)

---

## 📂 Project Structure
Invoice_NodeJs-/                                     
├──controllers/                                         
│   └── # Route logic                                                      
├── middleware/                                     
│   └── # Authentication & error handling           
├── models/                                         
│   └── # Mongoose schemas                          
├── routes/                                         
│   └── # API routes                                
├── utils/                                          
│   └── # Helper utilities                          
├── views/                                          
│   └── # EJS invoice templates                     
├── data/                                           
│   └── # Sample / seed data                        
├── app.js                
├── index.js                               
├── config.env.example                                                                                   
└── package.json                                    

## ⚙️ Prerequisites

Ensure you have the following installed:

- Node.js (v22 or higher — see `.nvmrc`)
- npm
- MongoDB (local or cloud)

---

## 🔐 Environment Variables

Create a `config.env` file in the root directory (see `config.env.example`):

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
BASE_URL=http://localhost:3000
CORS_ORIGIN=
```

Firebase: place your service-account JSON at `src/config/serviceAccountKey.json`
(gitignored) or set `FIREBASE_SERVICE_ACCOUNT` to its JSON contents.

> ⚠️ Never commit `config.env`, `serviceAccountKey.json`, or any credentials. The
> Firebase service account key and MongoDB/Gmail credentials were previously
> committed — see [SECURITY.md](SECURITY.md) for the required rotation steps.

---

## ▶️ Installation & Running Locally

```bash
git clone https://github.com/nishank23/Invoice_NodeJs-.git
cd Invoice_NodeJs-
npm install
npm start


-------




