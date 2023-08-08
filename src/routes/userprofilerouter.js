const express= require('express');

const router = express.Router();
const generateStorage = require('../helpers/multerhelper');

const upload = generateStorage('userphoto');

const userController  = require('../controllers/userProfileController');

const {authenticateToken} = require('../helpers/jwt')

router.post('/user-profile',authenticateToken, upload.single('file'),userController.createOrUpdateUserProfile);
router.get('/user-profile',authenticateToken,userController.getUserProfile);


router.post('/user-profile/upload', upload.single('file'), userController.uploadUserProfile);


module.exports = router;

