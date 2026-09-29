import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function CreateProject() {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    title: "",
    language: "",
    description: "",
    source_code: "",
  });

  const handleChange = (e) => {
    setProject({
      ...project,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async () => {
    try {
      await API.post("/projects/create", project);

      alert("Project Created Successfully");

      navigate("/dashboard");
    } catch (err) {
      console.log(err.response);
      alert("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl w-[500px]">

        <h1 className="text-3xl text-white font-bold text-center">
          Create New Project
        </h1>

        <div className="space-y-4 mt-6">

          <input
            name="title"
            placeholder="Project Title"
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-700 text-white"
          />

          <input
            name="language"
            placeholder="Language"
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-700 text-white"
          />

          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
            className="w-full p-3 rounded bg-slate-700 text-white"
          />

          <textarea
            name="source_code"
            placeholder="Source Code"
            onChange={handleChange}
            className="w-full h-40 p-3 rounded bg-slate-700 text-white"
          />

          <button
            onClick={handleCreate}
            className="w-full bg-blue-600 py-3 rounded text-white"
          >
            Create Project
          </button>

        </div>

      </div>
    </div>
  );
}