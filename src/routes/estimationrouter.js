const express = require('express');
const router = express.Router();
const estimateController = require('../controllers/estimationController');

const userController = require("../controllers/userProfileController");
const generateStorage = require('../helpers/multerhelper');
const {authenticateToken} = require("../helpers/jwt");



const uploadSign = generateStorage('Estimationsign');
// Create or Update Client
router.post('/create-est/',authenticateToken,uploadSign.single('file'), estimateController.createEstimation);
router.post('/est/:id', authenticateToken, estimateController.updateEstimation);
router.get('/allest', authenticateToken, estimateController.getEstimationByUser);


router.get('/curr-est', authenticateToken, estimateController.getLatestEstimationNo);
router.get('/get-est/:id', estimateController.getAllEstimateData);

router.get('/est/:id', authenticateToken, estimateController.getEstimationById).delete('/est/:id', authenticateToken, estimateController.deleteEstimation);



module.exports = router;
