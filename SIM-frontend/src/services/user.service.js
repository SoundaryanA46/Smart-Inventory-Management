import api from './api';

const API_URL = '/api/users';
const USER_PROFILE_URL = '/api/user';

class UserService {
  getAll() {
    return api.get(API_URL);
  }

  getById(id) {
    return api.get(`${API_URL}/${id}`);
  }

  create(user) {
    return api.post(API_URL, user);
  }

  updateRole(id, role) {
    return api.put(`${API_URL}/${id}/role`, { role });
  }

  delete(id) {
    return api.delete(`${API_URL}/${id}`);
  }

  // Profile methods
  getProfile() {
    return api.get(`${USER_PROFILE_URL}/profile`);
  }

  updateProfile(profileData) {
    return api.put(`${USER_PROFILE_URL}/profile`, profileData);
  }

  updatePassword(passwordData) {
    return api.put(`${USER_PROFILE_URL}/password`, passwordData);
  }
}

export default new UserService();
