const { OAuth2Client } = require("google-auth-library");
const User = require("./userModel");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const googleAuthCallback = async (code) => {
  // Exchange code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user info from ID token
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  console.log("Google payload received:", payload);
  const { email, name, picture, sub: googleId } = payload;

  console.log("Extracted user info:", { googleId, email, name });

  // Find or create user in MongoDB
  let user = await User.findOne({ googleId });
  console.log("Existing user found:", user ? "Yes" : "No");

  if (!user) {
    console.log("Creating new user...");
    user = new User({ googleId, email, name, picture });
    try {
      await user.save();
      console.log("New user successfully saved to DB:", user);
    } catch (saveError) {
      console.error("Error saving user to DB:", saveError);
      throw saveError;
    }
  } else {
    console.log("Existing user logged in from DB:", user);
  }

  return user;
};

module.exports = {
  googleAuthCallback,
};
