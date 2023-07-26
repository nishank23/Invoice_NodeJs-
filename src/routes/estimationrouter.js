const express = require('express');
const router = express.Router();
const estimateController = require('../controllers/estimationController');
const userController = require("../controllers/userProfileController");
const generateStorage = require('../helpers/multerhelper');
const {authenticateToken} = require("../helpers/jwt");

const upload = generateStorage('estimationsign');
// Create or Update Client
router.post('/est/', authenticateToken, estimateController.createEstimation);
router.post('/est/:id', authenticateToken, estimateController.updateEstimation);
router.get('/est', authenticateToken, estimateController.getAllEstimations);
router.get('/curr-est', authenticateToken, estimateController.getLatestEstimationNo);

router.get('/est/:id', authenticateToken, estimateController.getEstimationById).delete('/clients/:clientId', authenticateToken, estimateController.deleteEstimation);



module.exports = router;
