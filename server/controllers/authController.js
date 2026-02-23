import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Front door to the application, handles Google login flow.
 * Verifies the Google JWT token, creates a user in MongoDB if they don't exist,
 * and returns the user profile with the session token.
 * @param {Object} req - Express request object. Expects `req.body.token` (Google ID Token).
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 - Success: { status: "success", data: { user, token } }
 * @returns {JSON} 401 - Failure: { status: "fail", message: "Invalid Google Token" }
 */
export const googleLogin = async (req, res) => {
  const { token } = req.body;
  console.log(
    "2. Backend: Received token from frontend:",
    req.body.token?.substring(0, 10) + "...",
  );

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
  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
};
