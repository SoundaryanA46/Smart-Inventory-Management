import axios from 'axios';
import { isTokenExpired } from '@/utils/jwt';

// Must end with a trailing slash because we append paths like "signin"
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/`;

const SESSION_KEY = 'user';

class AuthService {
  login(username, password) {
    return axios
      .post(API_URL + 'signin', {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.data && response.data.token) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(response.data));
        }
        return response.data;
      });
  }

  logout() {
    this.clearSession();
  }

  /** Clear session storage and optionally redirect to login (used by 401 handler). */
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** True if user exists and token is present and not expired. */
  isSessionValid() {
    const user = this._getStoredUser();
    if (!user || !user.token) return false;
    if (isTokenExpired(user.token)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  _getStoredUser() {
    const userStr = sessionStorage.getItem(SESSION_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  register(username, email, password, firstName, lastName) {
    return axios.post(API_URL + 'signup', {
      username,
      email,
      password,
      firstName,
      lastName
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  checkUsername(username) {
    return axios.get(API_URL + 'check-username/' + username);
  }

  checkEmail(email) {
    return axios.get(API_URL + 'check-email/' + email);
  }

  getCurrentUser() {
    const user = this._getStoredUser();
    if (!user || !user.token) return null;
    if (isTokenExpired(user.token)) {
      this.clearSession();
      return null;
    }
    return user;
  }

  getAuthHeader() {
    const user = this.getCurrentUser();
    if (user && user.token) {
      return { Authorization: 'Bearer ' + user.token };
    }
    return {};
  }
}

export default new AuthService();