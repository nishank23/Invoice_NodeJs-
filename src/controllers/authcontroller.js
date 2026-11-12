const User = require("../models/UserModels/user");
const UserProfile = require("../models/UserModels/userprofile");
const genverifypass = require("../helpers/password");
const myjwt = require("../helpers/jwt");
const nodemailer = require("nodemailer");
const { getMessaging } = require("firebase-admin/messaging");

// Base URL for verification/reset links: explicit env var, or the request's host.
function getBaseUrl(req) {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL.replace(/\/+$/, "");
    }
    return `${req.protocol}://${req.get("host")}`;
}

function validatePassword(password) {
    if (typeof password !== "string" || password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    return null;
}

function createMailTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
        throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not configured");
    }
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

function buildVerificationLink(path, token, req) {
    const encodedToken = Buffer.from(token).toString("base64");
    return `${getBaseUrl(req)}/${path}?token=${encodedToken}`;
}

// Sign up with email
const signUpWithEmail = async (req, res) => {
  try {
    const { email, password, fcm } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ error: "User already exists" });
      } else {
        // Update existing user's details
        const hashpwd = await genverifypass.generatePasswordHash(password);
        await User.updateOne({ email }, { $set: { password: hashpwd, fcm } });

        // Resend the verification email
        const { token: verificationToken, expiresIn } =
          myjwt.generateResetToken();
        existingUser.emailVerificationToken = verificationToken;
        existingUser.emailVerificationExpires = new Date(
          Date.now() + parseDuration(expiresIn)
        );
        await existingUser.save();

        const verificationLink = buildVerificationLink("verify", verificationToken, req);

        const transporter = createMailTransporter();
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Verify Account",
          text: `Please confirm on the below link to verify your account \n ${verificationLink} request after confirming the request we suggest you to move back to app to reset password`,
        };
        await transporter.sendMail(mailOptions);

        return res.json({
          message: "Email verification instructions sent to email",
          data: existingUser._id,
        });
      }
    }

    // New user registration
    const hashpwd = await genverifypass.generatePasswordHash(password);
    const { token: verificationToken, expiresIn } = myjwt.generateResetToken();

    const newUser = new User({
      email,
      password: hashpwd,
      fcm,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + parseDuration(expiresIn)),
    });
    await newUser.save();

    const verificationLink = buildVerificationLink("verify", verificationToken);

    const transporter = createMailTransporter();
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Verify Account",
      text: `Please confirm on the below link to verify your account \n ${verificationLink} request after confirming the request we suggest you to move back to app to reset password`,
    };
    await transporter.sendMail(mailOptions);

    return res.json({
      message: "Email verification instructions sent to email",
      data: newUser._id,
    });
  } catch (error) {
    console.log("Error signing up with email:", error);
    res.status(500).json({ error: "Failed to sign up with email" });
  }
};

// Sign in with email
const signInWithEmail = async (req, res) => {
  try {
    const { email, password, fcm } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "No User found" });
    }

    if (user.password == null && user.googleId) {
      return res.status(400).json({ error: "User linked with Google" });
    }

    const isPasswordValid = await genverifypass.comparePasswords(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }
    user.fcm = fcm;
    user.lastSignInAt = new Date();
    await user.save();

    const token = myjwt.generateToken({ userId: user._id });
    res.json({ user, token });
  } catch (error) {
    console.log("Error signing in with email:", error);
    res.status(500).json({ error: "Failed to sign in with email" });
  }
};

// Sign up with Google
const signUpWithGoogle = async (req, res) => {
  try {
    const { email, googleId, fcm } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: "Email and googleId are required" });
    }

    let existingUser = await User.findOne({ email });
    let isProfileUpdate = false;

    if (existingUser) {
      let userProfile = await UserProfile.findOne({ userId: existingUser._id });
      if (userProfile != null) {
        isProfileUpdate = true;
      }

      existingUser.googleId = googleId;
      existingUser.fcm = fcm;
      await existingUser.save();
    } else {
      existingUser = new User({ email, googleId, fcm });
      await existingUser.save();
    }

    const token = myjwt.generateToken({ userId: existingUser._id });
    res.json({ user: existingUser, token, userProfileUpdated: isProfileUpdate });
  } catch (error) {
    console.log("Error signing up with Google:", error);
    res.status(500).json({ error: "Failed to sign up with Google" });
  }
};

// Sign in with Google
const signInWithGoogle = async (req, res) => {
  try {
    const { googleId, fcm } = req.body;

    if (!googleId) {
      return res.status(400).json({ error: "googleId is required" });
    }

    const user = await User.findOne({ googleId });
    if (!user) {
      return res.status(400).json({ error: "User not found.Please do google sign up first" });
    }

    user.fcm = fcm;
    user.lastSignInAt = new Date();
    await user.save();

    const token = myjwt.generateToken({ userId: user._id });
    res.json({ user, token });
  } catch (error) {
    console.log("Error signing in with Google:", error);
    res.status(500).json({ error: "Failed to sign in with Google" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, fcm } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.password == null) {
      return res.status(400).json({ error: "User not signed up with mail" });
    }

    const { token, expiresIn } = myjwt.generateResetToken();
    const duration = parseDuration(expiresIn);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + duration);
    user.fcm = fcm;
    await user.save();

    const resetPasswordLink = buildVerificationLink("verifyforget", token, req);

    const transporter = createMailTransporter();
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Please confirm on the below link to confirm your reset password \n ${resetPasswordLink} request after confirming the request we suggest you to move back to app to reset password`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: "Verify mail" });
  } catch (error) {
    console.log("Error in forgot password:", error);
    res.status(500).json({ error: "Failed to send password reset instructions" });
  }
};

const verifyForgetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Invalid or token got expired." });
    }
    const decodedToken = Buffer.from(token, "base64").toString();

    const user = await User.findOne({
      resetPasswordToken: decodedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or token got expired." });
    }

    const message = {
      token: user.fcm,
      data: {
        key: "Password Reset Token",
        value: `${decodedToken}`,
      },
    };
    getMessaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
    res.redirect("/reset-success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to verify reset password confirmation" });
  }
};

const verifyUserEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Invalid or token got expired." });
    }
    const decodedToken = Buffer.from(token, "base64").toString();

    const user = await User.findOne({
      emailVerificationToken: decodedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or token got expired." });
    }

    const usertoken = myjwt.generateToken({ userId: user._id });

    const message = {
      token: user.fcm,
      data: {
        key: "Verify User Token",
        value: JSON.stringify({ user, token: usertoken }),
      },
    };
    getMessaging()
      .send(message)
      .then(async (response) => {
        user.isEmailVerified = true;
        await user.save();
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });

    res.redirect("/verify-success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to verify reset password confirmation" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({ error: "Cannot use the previous password" });
    }

    const hashpwd = await genverifypass.generatePasswordHash(password);
    user.password = hashpwd;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error in reset password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Checks whether a user has verified their email and, if so, returns a token.
// Requires email + password proof of ownership (so a bare userId can't mint a token).
const userIsVerified = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({ error: "User not found" });
    }

    if (userData.password == null) {
      return res.status(400).json({ error: "User linked with Google" });
    }

    const isPasswordValid = await genverifypass.comparePasswords(password, userData.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    if (userData.isEmailVerified) {
      const token = myjwt.generateToken({ userId: userData._id });
      return res.json({ data: userData, token });
    }

    return res.json({ data: userData });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Failed to check verification status" });
  }
};

function parseDuration(duration) {
  if (typeof duration !== "string") {
    throw new Error("Invalid duration format");
  }

  const regex = /^(\d+)([smhdwMy]?)$/;
  const matches = duration.match(regex);
  if (!matches) {
    throw new Error("Invalid duration format");
  }

  const value = parseInt(matches[1]);
  const unit = matches[2];

  const conversion = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    w: 1000 * 60 * 60 * 24 * 7,
    M: 1000 * 60 * 60 * 24 * 30,
    y: 1000 * 60 * 60 * 24 * 365,
  };

  if (!conversion[unit]) {
    throw new Error("Invalid duration unit");
  }

  return value * conversion[unit];
}

module.exports = {
  signUpWithEmail,
  signInWithEmail,
  signUpWithGoogle,
  signInWithGoogle,
  forgotPassword,
  resetPassword,
  verifyForgetPassword,
  userIsVerified,
  verifyUserEmail,
};
