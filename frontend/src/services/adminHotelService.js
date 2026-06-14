import axios from "axios";

const API_URL = "http://localhost:5000/api/admin/hotels";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

const adminHotelService = {
 getById: (id) => {
    return axios.get(`${API_URL}/${id}`, getAuthHeader());
  },
  getHotels: () => {
    return axios.get(API_URL, getAuthHeader());
  },
};

export default adminHotelService;