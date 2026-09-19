import api from './api';

const API_URL = '/api/transactions';

class TransactionService {
  getAll(params = {}) {
    return api.get(API_URL, { params });
  }

  getById(id) {
    return api.get(`${API_URL}/${id}`);
  }
}

export default new TransactionService();
