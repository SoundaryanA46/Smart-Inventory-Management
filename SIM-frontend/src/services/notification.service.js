import axios from "axios";
import authHeader from "./auth-header";

// Admin notification settings API
// Backend controller: /api/admin/notification-settings
const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/admin/notification-settings`;

const getSettings = () => {
  return axios.get(API_URL, {
    headers: authHeader(),
  });
};

const updateSettings = (data) => {
  return axios.put(API_URL, data, {
    headers: authHeader(),
  });
};

export default {
  getSettings,
  updateSettings,
};

