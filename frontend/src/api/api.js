import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});


// --------------------------------------------------
// ADD JWT TOKEN TO EVERY REQUEST
// --------------------------------------------------

API.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// --------------------------------------------------
// HANDLE EXPIRED / INVALID JWT
// --------------------------------------------------

API.interceptors.response.use(

  (response) => {
    return response;
  },

  (error) => {

    const status = error.response?.status;

    const requestUrl = error.config?.url || "";

    // Do not redirect during login/register failures
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (
      status === 401 &&
      !isAuthRequest
    ) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      alert(
        "Your session has expired. Please login again."
      );

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);


export default API;