const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String, default: null },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    fcm:{
      type:String
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    lastSignInAt: {
        type: Date,
    },
    resetPasswordToken: String, // Add reset password token field
    resetPasswordExpires: Date,
    emailVerificationToken: String, // Separate field for email verification token
    emailVerificationExpires: Date, // Separate field for email verification token expiration
    isEmailVerified: { type: Boolean, default: false },

    //
});

userSchema.methods.comparePassword = function (enteredPassword) {
    const user = this;
    return bcrypt.compare(enteredPassword, user.password);
};

// Never leak password hashes or one-time tokens in API responses.
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.emailVerificationToken;
    delete obj.emailVerificationExpires;
    return obj;
};

// Create and export User model
const User = mongoose.model('User', userSchema);
module.exports = User;