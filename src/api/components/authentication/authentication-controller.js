const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');
const logger = require('../../../core/logger')('app');

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */

let loginAttempts = {};
let lastLoginAttemptTime = {};

const MAX_LOGIN_ATTEMPTS = 4;
const LOGIN_TIMEOUT = 30 * 60 * 1000; // 30 menit dalam ms

async function login(request, response, next) {
  const { email, password } = request.body;
  const key = email.toLowerCase();

  try {
    // mengecek jika ada terllu banyak login attempts
    const attempts = loginAttempts[key] || 0;
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
    const now = Date.now();

    if (
      lastLoginAttemptTime[key] &&
      now - lastLoginAttemptTime[key] > LOGIN_TIMEOUT
    ) {
      // reset attempt jika 30 menit sudah berlalu
      loginAttempts[key] = 0;
    }

    if (remainingAttempts <= 0) {
      logger.info(
        `Login gagal untuk email: ${email}. attempts: ${5 - remainingAttempts}, anda kena timeout 30 menit! karna gagal 5 kali attempt`
      );
      await new Promise((resolve) => setTimeout(resolve, 1 * 60 * 1000));
      delete loginAttempts[key];
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts'
      );
    }

    // check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );
    if (!loginSuccess) {
      loginAttempts[key] = (loginAttempts[key] || 0) + 1; // Increment failed attempts
      lastLoginAttemptTime[key] = now;
      logger.info(
        `Login gagal untuk email: ${email}. attempts: ${5 - remainingAttempts}`
      );
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );
    }

    // login berhasil, delete login jumlah attempts
    delete loginAttempts[key];

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
