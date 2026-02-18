import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handles initial Google Login/Sign-up.
 * Verifies the Google JWT token, creates a user in MongoDB if they don't exist,
 * and returns the user profile with the session token.
 * @param {Object} req - Express request object. Expects `req.body.token` (Google ID Token).
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 - Success: { status: "success", data: { user, token } }
 * @returns {JSON} 401 - Failure: { status: "fail", message: "Invalid Google Token" }
 */
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    // these keys are as per Google's payload rules, don't change payload variable names
    const { sub, email, given_name, family_name, picture } =
      ticket.getPayload();

    // if no user, create user
    let user = await User.findOne({ googleId: sub });

    if (!user) {
      user = await User.create({
        googleId: sub,
        email,
        firstName: given_name,
        lastName: family_name,
        picture,
      });
      console.log("🆕 New User Created in DB!");
    }

    res.status(200).json({ status: "success", data: { user, token } });
  } catch (error) {
    res.status(401).json({ status: "fail", message: "Invalid Google Token" });
  }
};

/**
 * Retrieves the currently authenticated user's profile.
 * Used for session persistence on page refresh.
 * @param {Object} req - Express request object. Expects "Authorization: Bearer <token>" header.
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 - Success: { status: "success", data: { user } }
 * @returns {JSON} 401 - Failure: No token or session invalid.
 * @returns {JSON} 404 - Failure: User exists in Google but not in our database.
 */
export const getMe = async (req, res) => {
  try {
    // Get token from the "Bearer <token>" header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "No token provided" });
    }

    // verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub } = ticket.getPayload();

    // find user in DB using the Google ID
    const user = await User.findOne({ googleId: sub });

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    res.status(401).json({ status: "fail", message: "Invalid session" });
  }
};
