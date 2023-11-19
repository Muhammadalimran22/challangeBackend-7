const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("../utils/nodemailer");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  forgotPassword: async (req, res, next) => {
    try {
      let { email } = req.body;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "user not found!",
          data: null,
        });
      }

      const token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
      const resetUrl = `http://localhost:3000/api/v1/auth/reset-password?token=${token}`;

      // Send password reset email
      const html = await nodemailer.getHtml("forgot-password.ejs", {
        name: user.name,
        resetUrl,
      });
      nodemailer.sendEmail(user.email, "Password Reset", html);

      return res.status(200).json({
        status: true,
        message: "OK",
        err: null,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { password, password_confirmation } = req.body;
      if (password !== password_confirmation) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "please ensure that the password and password confirmation match!",
          data: null,
        });
      }

      let { token } = req.query;
      try {
        decoded = jwt.verify(token, JWT_SECRET_KEY);
      } catch (err) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: err.message,
          data: null,
        });
      }

      const encryptedResetPassword = await bcrypt.hash(password, 10);
      let update = await prisma.user.update({
        where: { email: decoded.email },
        data: { password: encryptedResetPassword },
      });

      if (!update) {
        return res.status(400).json({
          success: true,
          message: "update failed",
          data: null,
        });
      }

      return res.status(201).json({
        status: true,
        message: "Created",
        err: null,
        data: update,
      });
    } catch (err) {
      next(err);
      console.log("Decoded:", decoded);
    }
  },
};
