import authService from "../services/authService.js";

/**
 * Controller to handle all user authentication requests.
 */
class AuthController {
  /**
   * Handle user registration.
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      await authService.registerUser(name, email, password);

      return res.status(201).json({
        success: true,
        message: "User registered successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user login.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user profile.
   */
  async profile(req, res, next) {
    try {
      const userId = req.user.userId;
      const userProfile = await authService.getUserProfile(userId);

      return res.status(200).json({
        success: true,
        message: "Request successful",
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile settings.
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { name, email, geminiApiKey, language } = req.body;
      const updatedUser = await authService.updateUserProfile(userId, { name, email, geminiApiKey, language });

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
