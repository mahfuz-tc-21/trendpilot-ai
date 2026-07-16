import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Service to handle authentication business logic.
 */
class AuthService {
  /**
   * Register a new user in the system.
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - Raw user password
   * @returns {Promise<object>} Created user document (without password hash)
   */
  async registerUser(name, email, password) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User with this email already exists");
      error.status = 409; // Conflict
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role: "member" // default role per DB spec
    });

    await user.save();

    // Return user info excluding password
    const userJson = user.toObject();
    delete userJson.passwordHash;
    return userJson;
  }

  /**
   * Log in an existing user and generate JWT token.
   * @param {string} email - User's email
   * @param {string} password - User's raw password
   * @returns {Promise<object>} Object containing token and user profile details
   */
  async loginUser(email, password) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401; // Unauthorized
      throw error;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.status = 401; // Unauthorized
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    );

    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      geminiApiKey: user.geminiApiKey || "",
      language: user.language || "bn"
    };

    return { token, user: userProfile };
  }

  /**
   * Retrieve user profile details.
   * @param {string} userId - Mongo ID of the user
   * @returns {Promise<object>} User profile details
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      const error = new Error("User not found");
      error.status = 404; // Not Found
      throw error;
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      geminiApiKey: user.geminiApiKey || "",
      language: user.language || "bn"
    };
  }

  /**
   * Update user profile details.
   * @param {string} userId - Mongo ID of the user
   * @param {object} updateData - Key values to change
   * @returns {Promise<object>} Updated user profile details
   */
  async updateUserProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.email !== undefined) user.email = updateData.email;
    if (updateData.geminiApiKey !== undefined) user.geminiApiKey = updateData.geminiApiKey;
    if (updateData.language !== undefined) user.language = updateData.language;

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      geminiApiKey: user.geminiApiKey || "",
      language: user.language || "bn"
    };
  }
}

export default new AuthService();
