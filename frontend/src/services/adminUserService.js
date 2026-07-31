import api from "./api";

const adminUserService = {
  getUsers: () => api.get("/admin/users"),

  getUserById: (id) =>
    api.get(`/admin/users/${id}`),

  lockUser: (id) =>
    api.patch(`/admin/users/${id}/lock`),

  unlockUser: (id) =>
    api.patch(`/admin/users/${id}/unlock`),

  createPartner: (data) =>
    api.post("/admin/users/partner", data),

  updatePartner: (id, data) =>
    api.put(`/admin/users/${id}/partner`, data),
};

export default adminUserService;