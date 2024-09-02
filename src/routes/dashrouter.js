const express = require('express');
const router = express.Router();


router.get('/clients',  clientController.getClientsByUser);


module.exports = router;
