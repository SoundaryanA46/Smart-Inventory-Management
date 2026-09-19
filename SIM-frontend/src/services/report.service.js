import api from './api';

const API_BASE = '/api/reports';

class ReportService {
  downloadProductsCSV() {
    return api.get(`${API_BASE}/products.csv`, { responseType: 'blob' }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  downloadProductsPDF() {
    return api.get(`${API_BASE}/products.pdf`, { responseType: 'blob' }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  downloadTransactionsCSV(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    
    return api.get(`${API_BASE}/transactions.csv`, { params, responseType: 'blob' }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  downloadTransactionsPDF(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    
    return api.get(`${API_BASE}/transactions.pdf`, { params, responseType: 'blob' }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }
}

export default new ReportService();
