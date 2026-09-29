export default function ProjectCard({ title, language }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 hover:scale-105 transition duration-300 cursor-pointer shadow-lg">

      <h3 className="text-xl font-bold text-white">
        {title}
      </h3>

      <p className="text-gray-400 mt-2">
        {language}
      </p>

      <button className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
        Open Project
      </button>

    </div>
  );
}