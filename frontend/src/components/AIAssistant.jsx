import { useState } from "react";
import API from "../api/api";

export default function AIAssistant({ code, language }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async (customPrompt = null) => {
    const userPrompt = customPrompt || prompt;

    if (!userPrompt.trim()) {
      return;
    }

    try {
      setLoading(true);
      setResponse("AI is thinking...");

      const fullPrompt = `
You are the AI coding assistant for CodeVerse.

Programming Language: ${language}

Here is the user's current code:

${code}

User request:
${userPrompt}

Give a clear and useful answer.
If code is needed, provide the code in a code block.
`;

      const result = await API.post("/ai/chat", {
        prompt: fullPrompt,
      });

      setResponse(result.data.response);
    } catch (error) {
      console.log(error);

      if (error.response?.data?.detail) {
        setResponse(error.response.data.detail);
      } else {
        setResponse("Unable to connect to AI.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-700 w-full lg:w-[380px] flex flex-col">

      {/* Header */}
      <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h2 className="font-bold text-white">
          🤖 AI Assistant
        </h2>

        <p className="text-xs text-gray-400 mt-1">
          Powered by CodeVerse AI
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-3 grid grid-cols-2 gap-2">

        <button
          onClick={() =>
            askAI("Explain this code step by step.")
          }
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs"
        >
          🧠 Explain Code
        </button>

        <button
          onClick={() =>
            askAI("Find errors or bugs in this code.")
          }
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs"
        >
          🐛 Find Errors
        </button>

        <button
          onClick={() =>
            askAI("Suggest improvements for this code.")
          }
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs"
        >
          ✨ Improve
        </button>

        <button
          onClick={() =>
            askAI("Optimize this code and explain the changes.")
          }
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs"
        >
          ⚡ Optimize
        </button>

      </div>

      {/* AI Response */}
      <div className="flex-1 overflow-auto px-4 py-3">

        {response ? (
          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans">
            {response}
          </pre>
        ) : (
          <p className="text-sm text-gray-500">
            Ask the AI about your code...
          </p>
        )}

      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something about your code..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <button
          onClick={() => askAI()}
          disabled={loading || !prompt.trim()}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 px-4 py-2 rounded-lg font-semibold"
        >
          {loading ? "Thinking..." : "🤖 Ask AI"}
        </button>

      </div>

    </div>
  );
}