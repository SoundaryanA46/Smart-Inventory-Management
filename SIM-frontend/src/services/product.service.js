import api from './api';

const API_URL = '/api/products';

class ProductService {
  getAll() {
    return api.get(API_URL);
  }

  getById(id) {
    return api.get(`${API_URL}/${id}`);
  }

  create(product) {
    return api.post(API_URL, product);
  }

  update(id, product) {
    return api.put(`${API_URL}/${id}`, product);
  }

  delete(id) {
    return api.delete(`${API_URL}/${id}`);
  }

  adjustStock(id, adjustment) {
    return api.post(`${API_URL}/${id}/stock-adjustment`, adjustment);
  }
}

export default new ProductService();
