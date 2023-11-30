const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

const generateStorage = require('../helpers/multerhelper');
const {authenticateToken} = require("../helpers/jwt");



const uploadSign = generateStorage('Estimationsign');
// Create or Update Client
router.post('/create-inv/',authenticateToken,uploadSign.single('file'), invoiceController.createInvoice);
router.post('/inv/:id', authenticateToken, invoiceController.updateInvoice);
router.get('/allinv', authenticateToken, invoiceController.getInvoiceByUser);


router.get('/curr-inv', authenticateToken, invoiceController.getLatestInvoiceNo);
router.get('/get-inv/:id', invoiceController.getAllInvoiceData);

router.get('/invpreview/:id', invoiceController.getInvoicePreview);

router.get('/inv/:id', authenticateToken, invoiceController.getInvoiceById).delete('/inv/:id', authenticateToken, invoiceController.deleteInvoice);



module.exports = router;