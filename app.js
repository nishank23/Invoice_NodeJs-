// Load environment variables once, before any module reads process.env.
require('dotenv').config({ path: './config.env' });

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const setBaseUrlMiddleware = require('./src/helpers/middleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));

// Security headers
app.use(helmet());

// CORS — restrict origins via CORS_ORIGIN (comma-separated). Defaults to * for the mobile API.
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General request rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use(express.json({ limit: '1mb' }));
app.use(setBaseUrlMiddleware);

app.use('/public/', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

const authrouter = require('./src/routes/authroutes');
const userprofilerouter = require('./src/routes/userprofilerouter');
const locationRoutes = require('./src/routes/locationrouter');
const clientRouter = require('./src/routes/clientrouter');
const productRouter = require('./src/routes/productroutes');
const estimateRouter = require('./src/routes/estimationrouter');
const invoiceRouter = require('./src/routes/invoicerouter');
const verifyRouter = require('./src/routes/verifyroutes');
const dashRouter = require('./src/controllers/dashcontroller');

app.use('/api/v1', authrouter);
app.use('/api/v1', userprofilerouter);
app.use('/api/v1', locationRoutes);
app.use('/api/v1', clientRouter);
app.use('', verifyRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/', estimateRouter);
app.use('/api/v1/', invoiceRouter);
app.use('/api/v1/', dashRouter);

app.get('/reset-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-success.html'));
});
app.get('/verify-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'verify-success.html'));
});

app.get('/', (req, res) => {
    res.render('home');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler — do not leak stack traces
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
