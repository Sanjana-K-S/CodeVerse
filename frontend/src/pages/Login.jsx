import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    email: "",
    password: "",
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
    const email = user.email.trim();
    const password = user.password;

    if (!email) {
      return "Email is required";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address";
    }

    if (!password) {
      return "Password is required";
    }

    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email: user.email.trim(),
        password: user.password,
      });

      // Save JWT token
      localStorage.setItem(
        "token",
        response.data.access_token
      );

      // Save logged-in user information
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.data.user_id,
          username: response.data.username,
          email: response.data.email,
        })
      );

      alert("Login Successful");

      navigate("/dashboard");

    } catch (err) {
      console.log("LOGIN ERROR:", err.response);

      setError(
        err.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">

      <div className="bg-slate-800 w-[420px] rounded-xl shadow-2xl p-8">

        <h1 className="text-4xl font-bold text-white text-center">
          CodeVerse
        </h1>

        <p className="text-gray-400 text-center mt-2">
          Collaborative Coding Platform
        </p>

        {error && (
          <div className="mt-6 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="mt-8"
        >

          <div>
            <label className="text-white">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={user.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full mt-2 p-3 rounded-lg bg-slate-700 text-white outline-none"
            />
          </div>

          <div className="mt-5">
            <label className="text-white">
              Password
            </label>

            <input
              name="password"
              type="password"
              value={user.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full mt-2 p-3 rounded-lg bg-slate-700 text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-gray-400 mt-5 text-center">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:underline"
            >
              Register
            </Link>
          </p>

        </form>

      </div>

    </div>
  );
}