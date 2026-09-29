import { Home, FolderOpen, Users, Bot, User, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white h-screen p-6 shadow-lg">

      <h1 className="text-3xl font-bold text-blue-500">
        CodeVerse
      </h1>

      <p className="text-gray-400 text-sm mt-1">
        Collaborative Coding
      </p>

      <nav className="mt-10 space-y-3">

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <Home size={20} />
          <span>Dashboard</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <FolderOpen size={20} />
          <span>Projects</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <Bot size={20} />
          <span>AI Assistant</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <Users size={20} />
          <span>Team</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <User size={20} />
          <span>Profile</span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer">
          <Settings size={20} />
          <span>Settings</span>
        </div>

      </nav>

    </aside>
  );
}