import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const getMe = () => {
  return api.get(ENDPOINTS.USERS.GET_ME);
};

export const updateMe = (data) => {
  return api.put(ENDPOINTS.USERS.UPDATE_ME, data);
};
export const deleteMe = () => {
  return api.delete(ENDPOINTS.USERS.DELETE_ME);
};

export const changeMyPassword = (data) => {
  return api.put(ENDPOINTS.USERS.CHANGE_MY_PASSWORD, data);
};

export const getAllUsers = (params) => {
  return api.get(ENDPOINTS.USERS.GET_ALL, { params });
};

export const getUser = (id) => {
  return api.get(ENDPOINTS.USERS.GET_ONE(id));
};

export const createUser = (data) => {
  return api.post(ENDPOINTS.USERS.CREATE, data);
};

export const updateUser = (id, data) => {
  return api.put(ENDPOINTS.USERS.UPDATE(id), data);
};

export const changePassword = (id, data) => {
  return api.put(ENDPOINTS.USERS.CHANGE_PASSWORD(id), data);
};

export const activateUser = (id) => {
  return api.put(ENDPOINTS.USERS.ACTIVATE(id));
};

export const deactivateUser = (id) => {
  return api.put(ENDPOINTS.USERS.DEACTIVATE(id));
};
