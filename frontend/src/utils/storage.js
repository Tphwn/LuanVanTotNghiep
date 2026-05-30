export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');