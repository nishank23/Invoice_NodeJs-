# Invoice Generator – Backend (Node.js)

A scalable backend service for managing clients, products, and invoices.  
Built using Node.js with RESTful APIs to support a Flutter-based invoice generator application.

---

## 🚀 Features

- User authentication (JWT based)
- Client management (CRUD)
- Product & service management
- Invoice creation & tracking
- Invoice status (Paid / Unpaid / Pending)
- Analytics support (weekly / monthly data)
- Secure API architecture

---

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- REST APIs

---

## 📂 Project Structure
├── controllers/
├── models/
├── routes/
├── middleware/
├── config/
├── utils/
├── app.js
└── server.js



---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:
PORT=3000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key



---

## ▶️ Installation & Run

```bash
git clone https://github.com/your-username/invoice-generator-backend.git
cd invoice-generator-backend
npm install
npm start








