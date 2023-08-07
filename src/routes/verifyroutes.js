const express= require('express');

const router = express.Router();

const {
    signInWithEmail,signInWithGoogle,signUpWithEmail,signUpWithGoogle,forgotPassword,verifyForgetPassword,resetPassword,verifyUserEmail
}= require('../controllers/authcontroller');




/*  Shifted this api to main as we cant use here in the api router section */
router.route("/verifyforget").get(verifyForgetPassword);
router.route("/verify").get(verifyUserEmail);





module.exports = router;