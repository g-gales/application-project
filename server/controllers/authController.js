import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
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

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    res.status(401).json({ status: "fail", message: "Invalid Google Token" });
  }
};
