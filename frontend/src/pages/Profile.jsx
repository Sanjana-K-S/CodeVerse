import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await API.get("/profile/");

      setProfile(response.data);
      setUsername(response.data.username);
      setEmail(response.data.email);

      // Keep localStorage synchronized
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
        })
      );
    } catch (error) {
      console.error("Unable to load profile:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      } else {
        setError("Unable to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const trimmedUsername = username.trim();
const trimmedEmail = email.trim();

if (!trimmedUsername) {
  setError("Username cannot be empty");
  return;
}

if (trimmedUsername.length < 3) {
  setError("Username must contain at least 3 characters");
  return;
}

if (trimmedUsername.length > 30) {
  setError("Username cannot exceed 30 characters");
  return;
}

if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
  setError(
    "Username can contain only letters, numbers, and underscore"
  );
  return;
}

if (!trimmedEmail) {
  setError("Email cannot be empty");
  return;
}

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(trimmedEmail)) {
  setError("Please enter a valid email address");
  return;
}

    try {
      setSaving(true);

      const response = await API.put("/profile/", {
  username: trimmedUsername,
  email: trimmedEmail,
});

      setProfile(response.data);

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
        })
      );

      setMessage("Profile updated successfully");
      setEditingProfile(false);
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword) {
      setError("Enter your current password");
      return;
    }

    if (!newPassword) {
      setError("Enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must contain at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setSaving(true);

      const response = await API.put(
        "/profile/password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        }
      );

      setMessage(
        response.data.message ||
          "Password changed successfully"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
    } catch (error) {
      console.error("Password change error:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to change password"
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelProfileEdit = () => {
    setUsername(profile.username);
    setEmail(profile.email);
    setEditingProfile(false);
    setMessage("");
    setError("");
  };

  const cancelPasswordChange = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
    setMessage("");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-gray-400">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-400">
          Unable to load profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold text-purple-400">
              CodeVerse
            </h1>
            <p className="text-xs text-gray-500">
              My Profile
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            My Profile
          </h2>

          <p className="text-gray-400 mt-2">
            View and manage your CodeVerse account details.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-400">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex flex-col items-center text-center">

              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold mb-4">
                {profile.username
                  .substring(0, 2)
                  .toUpperCase()}
              </div>

              <h3 className="text-xl font-semibold">
                {profile.username}
              </h3>

              <p className="text-gray-400 mt-1 break-all">
                {profile.email}
              </p>

              <div className="mt-6 w-full border-t border-slate-800 pt-5">
                <p className="text-xs text-gray-500">
                  User ID
                </p>

                <p className="text-sm text-gray-300 mt-1">
                  #{profile.id}
                </p>
              </div>

            </div>

          </div>

          {/* Account details */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h3 className="text-xl font-semibold">
                  Account Details
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Your registered CodeVerse account information.
                </p>
              </div>

              {!editingProfile && (
                <button
                  onClick={() => {
                    setEditingProfile(true);
                    setMessage("");
                    setError("");
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
                >
                  ✏️ Edit
                </button>
              )}

            </div>

            {!editingProfile ? (

              <div className="space-y-6">

                <div>
                  <label className="text-sm text-gray-500">
                    Username
                  </label>

                  <p className="mt-1 text-lg">
                    {profile.username}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">
                    Email
                  </label>

                  <p className="mt-1 text-lg break-all">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">
                    Password
                  </label>

                  <p className="mt-1 text-lg tracking-widest">
                    ••••••••••••
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Your password is securely stored and cannot be displayed.
                  </p>
                </div>

              </div>

            ) : (

              <form
                onSubmit={updateProfile}
                className="space-y-5"
              >

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

          </div>

        </div>

        {/* Password section */}
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-xl font-semibold">
                Password
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Change your CodeVerse account password.
              </p>
            </div>

            {!changingPassword && (
              <button
                onClick={() => {
                  setChangingPassword(true);
                  setMessage("");
                  setError("");
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                🔑 Change Password
              </button>
            )}

          </div>

          {changingPassword && (

            <form
              onSubmit={changePassword}
              className="mt-6 max-w-xl space-y-5"
            >

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving
                    ? "Changing..."
                    : "Change Password"}
                </button>

                <button
                  type="button"
                  onClick={cancelPasswordChange}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>

              </div>

            </form>

          )}

        </div>

      </main>
    </div>
  );
}