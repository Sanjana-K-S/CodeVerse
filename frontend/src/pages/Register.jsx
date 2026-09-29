import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const validateForm = () => {
    const username = user.username.trim();
    const email = user.email.trim();
    const password = user.password;
    const confirmPassword = user.confirmPassword;

    if (!username) {
      return "Username is required";
    }

    if (username.length < 3) {
      return "Username must contain at least 3 characters";
    }

    if (username.length > 30) {
      return "Username cannot exceed 30 characters";
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return "Username can contain only letters, numbers, and underscore";
    }

    if (!email) {
      return "Email is required";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address";
    }

    if (!password) {
      return "Password is required";
    }

    if (password.length < 6) {
      return "Password must contain at least 6 characters";
    }

    if (password.length > 128) {
      return "Password cannot exceed 128 characters";
    }

    if (!confirmPassword) {
      return "Please confirm your password";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/register", {
        username: user.username.trim(),
        email: user.email.trim(),
        password: user.password,
      });

      alert("Registration Successful!");

      navigate("/");
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.detail ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl w-[450px] shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center">
          Create Account
        </h1>

        {error && (
          <div className="mt-5 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className="mt-6 space-y-4"
        >
          <input
            name="username"
            value={user.username}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-700 text-white"
            placeholder="Username"
            maxLength={30}
          />

          <input
            name="email"
            type="email"
            value={user.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-700 text-white"
            placeholder="Email"
          />

          <input
            name="password"
            type="password"
            value={user.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-700 text-white"
            placeholder="Password"
            maxLength={128}
          />

          <input
            name="confirmPassword"
            type="password"
            value={user.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-700 text-white"
            placeholder="Confirm Password"
            maxLength={128}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded-lg text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="text-center text-gray-400">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-400"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}