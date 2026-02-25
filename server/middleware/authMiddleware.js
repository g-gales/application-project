import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const protect = async (req, res, next) => {
  try {
    // this is getting the token from the string attached to the header of every request in axios/frontend
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "No token provided" });
    }

    // guest login
    if (token === "GUEST_USER_POWERUP") {
      const user = await User.findOne({ googleId: "GUEST_USER_POWERUP" });
      if (!user)
        return res
          .status(401)
          .json({ message: "Guest session initialized. Please try again." });

      // if guest user, skip verify Google ID
      req.user = user;
      return next();
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub } = ticket.getPayload();
    const user = await User.findOne({ googleId: sub });

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    // attaching the user to the request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Invalid session",
    });
  }
};
