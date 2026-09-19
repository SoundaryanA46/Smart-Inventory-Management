import api from './api';

const API_URL = '/api/alerts';

class AlertService {
  getLowStock() {
    return api.get(`${API_URL}/low-stock`);
  }
}

export default new AlertService();
