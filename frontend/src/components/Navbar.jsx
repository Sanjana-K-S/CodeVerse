import { Bell } from "lucide-react";

export default function Navbar() {
  return (
    <div className="flex justify-between items-center bg-slate-800 text-white p-5 rounded-xl">

      <div>
        <h2 className="text-3xl font-bold">
          Welcome Back 👋
        </h2>

        <p className="text-gray-400">
          Ready to build something amazing?
        </p>
      </div>

      <div className="flex items-center gap-5">

        <Bell className="cursor-pointer hover:text-blue-400" />

        <img
          src="https://i.pravatar.cc/40"
          alt="profile"
          className="rounded-full"
        />

      </div>

    </div>
  );
}