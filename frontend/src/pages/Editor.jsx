import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import API from "../api/api";
import AIAssistant from "../components/AIAssistant";

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  // ============================================================
  // SAVE / AUTO-SAVE
  // ============================================================

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  const autoSaveTimerRef = useRef(null);
  const latestCodeRef = useRef("");
  const latestProjectRef = useRef(null);
  const savingRef = useRef(false);

  // ============================================================
  // REAL-TIME COLLABORATION
  // ============================================================

  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const websocketRef = useRef(null);

  // Prevent received WebSocket changes
  // from being sent back again.
  const receivingChangeRef = useRef(false);

  // ============================================================
  // COLLABORATION / SHARE
  // ============================================================

  const [showShare, setShowShare] =
    useState(false);

  const [collaboratorEmail, setCollaboratorEmail] =
    useState("");

  const [collaborators, setCollaborators] =
    useState([]);

  const [inviting, setInviting] =
    useState(false);

  const [loadingCollaborators, setLoadingCollaborators] =
    useState(false);

  // ============================================================
  // TRANSLATION
  // ============================================================

  const [showTranslate, setShowTranslate] =
    useState(false);

  const [targetLanguage, setTargetLanguage] =
    useState("");

  const [translating, setTranslating] =
    useState(false);

  const [translatedCode, setTranslatedCode] =
    useState("");

  const [showTranslationPreview, setShowTranslationPreview] =
    useState(false);

  const languages = [
    "Python",
    "Java",
    "C",
    "C++"
  ];

  // ============================================================
  // LOAD PROJECT
  // ============================================================

  useEffect(() => {
    loadProject();
    loadCollaborators();
  }, [id]);

  // ============================================================
  // REAL-TIME WEBSOCKET CONNECTION
  // ============================================================

  useEffect(() => {
    if (!id) {
      return;
    }

    const token =
      localStorage.getItem("token");

    const userData =
      localStorage.getItem("user");

    if (!token || !userData) {
      console.log(
        "No authentication data found"
      );
      return;
    }

    let user;

    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error(
        "Invalid user data:",
        error
      );
      return;
    }

    if (!user?.id) {
      console.log(
        "Invalid user data"
      );
      return;
    }

    console.log(
      `Connecting to collaboration server: Project ${id}, User ${user.id}`
    );

    const websocket = new WebSocket(
      `ws://127.0.0.1:8000/collaborations/ws/${id}?token=${encodeURIComponent(token)}`
    );

    websocketRef.current =
      websocket;

    // ----------------------------------------------------------
    // WEBSOCKET OPEN
    // ----------------------------------------------------------

    websocket.onopen = () => {
      console.log(
        "✅ Collaboration WebSocket connected"
      );

      setConnectionStatus(
        "Connected"
      );

      setOnlineUsers(
        (previousUsers) => {

          if (
            previousUsers.includes(
              user.id
            )
          ) {
            return previousUsers;
          }

          return [
            ...previousUsers,
            user.id
          ];
        }
      );
    };

    // ----------------------------------------------------------
    // WEBSOCKET MESSAGE
    // ----------------------------------------------------------

    websocket.onmessage = (event) => {

      try {

        const data =
          JSON.parse(event.data);

        console.log(
          "📨 Collaboration message:",
          data
        );

        // ------------------------------------------------------
        // ONLINE USERS
        // ------------------------------------------------------

        if (
          data.type ===
          "online_users"
        ) {

          setOnlineUsers(
            (previousUsers) => {

              const users =
                data.users || [];

              if (
                !users.includes(
                  user.id
                )
              ) {
                return [
                  ...users,
                  user.id
                ];
              }

              return users;
            }
          );

          return;
        }

        // ------------------------------------------------------
        // USER JOINED
        // ------------------------------------------------------

        if (
          data.type ===
          "user_joined"
        ) {

          setOnlineUsers(
            (previousUsers) => {

              if (
                previousUsers.includes(
                  data.user_id
                )
              ) {
                return previousUsers;
              }

              return [
                ...previousUsers,
                data.user_id
              ];
            }
          );

          return;
        }

        // ------------------------------------------------------
        // USER LEFT
        // ------------------------------------------------------

        if (
          data.type ===
          "user_left"
        ) {

          setOnlineUsers(
            (previousUsers) =>
              previousUsers.filter(
                (userId) =>
                  userId !==
                  data.user_id
              )
          );

          return;
        }

        // ------------------------------------------------------
        // REAL-TIME CODE UPDATE
        // ------------------------------------------------------

        if (
          data.type ===
          "code_update"
        ) {

          receivingChangeRef.current =
            true;

          const receivedCode =
            data.code || "";

          setCode(
            receivedCode
          );

          latestCodeRef.current =
            receivedCode;

          setSaved(false);

          // Cancel previous auto-save
          if (
            autoSaveTimerRef.current
          ) {
            clearTimeout(
              autoSaveTimerRef.current
            );
          }

          // Auto-save received changes
          autoSaveTimerRef.current =
            setTimeout(() => {
              autoSaveProject();
            }, 2000);

          setTimeout(() => {
            receivingChangeRef.current =
              false;
          }, 0);

          return;
        }

      } catch (error) {

        console.error(
          "❌ WebSocket message error:",
          error
        );
      }
    };

    // ----------------------------------------------------------
    // WEBSOCKET ERROR
    // ----------------------------------------------------------

    websocket.onerror = (error) => {

      console.error(
        "❌ Collaboration WebSocket error:",
        error
      );

      setConnectionStatus(
        "Connection error"
      );
    };

    // ----------------------------------------------------------
    // WEBSOCKET CLOSE
    // ----------------------------------------------------------

    websocket.onclose = (event) => {

      console.log(
        "🔌 Collaboration WebSocket closed:",
        event.code,
        event.reason
      );

      setConnectionStatus(
        "Disconnected"
      );

      if (
        websocketRef.current ===
        websocket
      ) {
        websocketRef.current =
          null;
      }
    };

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {

      console.log(
        `Closing collaboration WebSocket: Project ${id}, User ${user.id}`
      );

      if (
        websocket.readyState ===
          WebSocket.OPEN ||
        websocket.readyState ===
          WebSocket.CONNECTING
      ) {
        websocket.close();
      }

      if (
        websocketRef.current ===
        websocket
      ) {
        websocketRef.current =
          null;
      }
    };

  }, [id]);

  // ============================================================
  // AUTO-SAVE TIMER CLEANUP
  // ============================================================

  useEffect(() => {

    return () => {

      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }

    };

  }, []);

  // ============================================================
  // LOAD PROJECT
  // ============================================================

  const loadProject = async () => {

    try {

      const response =
        await API.get(
          `/projects/${id}`
        );

      const loadedProject =
        response.data;

      const loadedCode =
        loadedProject.source_code ||
        "";

      setProject(
        loadedProject
      );

      setCode(
        loadedCode
      );

      latestCodeRef.current =
        loadedCode;

      latestProjectRef.current =
        loadedProject;

      setSaved(true);

    } catch (err) {

      console.log(
        "Unable to load project:",
        err
      );

      alert(
        err.response?.data?.detail ||
        "Unable to load project"
      );

      navigate(
        "/dashboard"
      );
    }
  };

  // ============================================================
  // LOAD COLLABORATORS
  // ============================================================

  const loadCollaborators =
    async () => {

      try {

        setLoadingCollaborators(
          true
        );

        const response =
          await API.get(
            `/collaborators/${id}`
          );

        setCollaborators(
          response.data || []
        );

      } catch (err) {

        console.log(
          "Unable to load collaborators:",
          err
        );

      } finally {

        setLoadingCollaborators(
          false
        );
      }
    };

  // ============================================================
  // LANGUAGE
  // ============================================================

  const changeLanguage =
    (newLanguage) => {

      setProject(
        (previousProject) => {

          const updatedProject = {
            ...previousProject,
            language:
              newLanguage
          };

          latestProjectRef.current =
            updatedProject;

          return updatedProject;
        }
      );

      setSaved(false);

      setOutput("");

      // Auto-save language change
      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }

      autoSaveTimerRef.current =
        setTimeout(() => {
          autoSaveProject();
        }, 2000);
    };

  // ============================================================
  // CODE CHANGE
  // ============================================================

  const handleCodeChange =
    (value) => {

      const newCode =
        value || "";

      setCode(
        newCode
      );

      latestCodeRef.current =
        newCode;

      setSaved(false);

      // --------------------------------------------------------
      // DON'T SEND RECEIVED CHANGES BACK
      // --------------------------------------------------------

      if (
        receivingChangeRef.current
      ) {
        return;
      }

      // --------------------------------------------------------
      // SEND LOCAL CHANGE
      // --------------------------------------------------------

      if (
        websocketRef.current &&
        websocketRef.current.readyState ===
          WebSocket.OPEN
      ) {

        websocketRef.current.send(
          JSON.stringify({
            type:
              "code_update",

            project_id:
              Number(id),

            code:
              newCode
          })
        );
      }

      // --------------------------------------------------------
      // AUTO-SAVE
      // --------------------------------------------------------

      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }

      autoSaveTimerRef.current =
        setTimeout(() => {

          autoSaveProject();

        }, 2000);
    };

  // ============================================================
  // AUTO-SAVE PROJECT
  // ============================================================

  const autoSaveProject =
    async () => {

      if (
        !latestProjectRef.current
      ) {
        return;
      }

      if (
        savingRef.current
      ) {
        return;
      }

      const currentCode =
        latestCodeRef.current;

      try {

        savingRef.current =
          true;

        setSaving(true);

        await API.put(
          `/projects/${id}`,
          {
            title:
              latestProjectRef.current
                .title,

            language:
              latestProjectRef.current
                .language,

            description:
              latestProjectRef.current
                .description,

            source_code:
              currentCode
          }
        );

        setSaved(true);

        console.log(
          "✓ Project auto-saved"
        );

      } catch (err) {

        console.error(
          "Auto-save error:",
          err
        );

        setSaved(false);

      } finally {

        savingRef.current =
          false;

        setSaving(false);
      }
    };

  // ============================================================
  // MANUAL SAVE PROJECT
  // ============================================================

  const saveProject =
    async () => {

      if (!project) {
        return;
      }

      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }

      try {

        savingRef.current =
          true;

        setSaving(true);

        await API.put(
          `/projects/${id}`,
          {
            title:
              project.title,

            language:
              project.language,

            description:
              project.description,

            source_code:
              code
          }
        );

        latestCodeRef.current =
          code;

        latestProjectRef.current =
          project;

        setSaved(true);

        alert(
          "Project Saved Successfully"
        );

      } catch (err) {

        console.log(
          "Save error:",
          err
        );

        if (
          err.response?.data?.detail
        ) {

          alert(
            err.response.data.detail
          );

        } else {

          alert(
            "Failed to save project"
          );
        }

      } finally {

        savingRef.current =
          false;

        setSaving(false);
      }
    };

  // ============================================================
  // RUN CODE
  // ============================================================

  const runCode =
    async () => {

      if (!project) {
        return;
      }

      try {

        setRunning(true);

        setOutput(
          "Running program..."
        );

        const response =
          await API.post(
            "/code/run",
            {
              language:
                project.language,

              source_code:
                code
            }
          );

        setOutput(
          response.data.output ||
          "Program executed successfully."
        );

      } catch (err) {

        console.log(
          "Execution error:",
          err
        );

        if (
          err.response?.data?.detail
        ) {

          setOutput(
            err.response.data.detail
          );

        } else {

          setOutput(
            "Error while executing code."
          );
        }

      } finally {

        setRunning(false);
      }
    };

  // ============================================================
  // CLEAR OUTPUT
  // ============================================================

  const clearOutput =
    () => {
      setOutput("");
    };

  // ============================================================
  // TRANSLATION
  // ============================================================

  const openTranslate =
    () => {

      if (!code.trim()) {

        alert(
          "Please write some code before translating."
        );

        return;
      }

      const availableLanguages =
        languages.filter(
          (language) =>
            language !==
            project.language
        );

      setTargetLanguage(
        availableLanguages[0] || ""
      );

      setTranslatedCode("");

      setShowTranslationPreview(
        false
      );

      setShowTranslate(true);
    };

  const translateCode =
    async () => {

      if (!targetLanguage) {

        alert(
          "Please select a target language."
        );

        return;
      }

      if (!code.trim()) {

        alert(
          "Please write some code before translating."
        );

        return;
      }

      try {

        setTranslating(true);

        setTranslatedCode("");

        const response =
          await API.post(
            "/ai/translate",
            {
              source_code:
                code,

              source_language:
                project.language,

              target_language:
                targetLanguage
            }
          );

        setTranslatedCode(
          response.data.translated_code ||
          ""
        );

        setShowTranslationPreview(
          true
        );

      } catch (err) {

        console.log(
          "Translation error:",
          err
        );

        if (
          err.response?.data?.detail
        ) {

          alert(
            err.response.data.detail
          );

        } else {

          alert(
            "Unable to translate code."
          );
        }

      } finally {

        setTranslating(false);
      }
    };

  // ============================================================
  // APPLY TRANSLATION
  // ============================================================

  const applyTranslation =
    () => {

      if (
        !translatedCode.trim()
      ) {

        alert(
          "No translated code available."
        );

        return;
      }

      const newLanguage =
        targetLanguage;

      setCode(
        translatedCode
      );

      latestCodeRef.current =
        translatedCode;

      setProject(
        (previousProject) => {

          const updatedProject = {
            ...previousProject,
            language:
              newLanguage
          };

          latestProjectRef.current =
            updatedProject;

          return updatedProject;
        }
      );

      setSaved(false);

      setOutput("");

      setShowTranslationPreview(
        false
      );

      setShowTranslate(false);

      // Send translation to collaborators
      if (
        websocketRef.current &&
        websocketRef.current.readyState ===
          WebSocket.OPEN
      ) {

        websocketRef.current.send(
          JSON.stringify({
            type:
              "code_update",

            project_id:
              Number(id),

            code:
              translatedCode
          })
        );
      }

      // Auto-save translation
      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );
      }

      autoSaveTimerRef.current =
        setTimeout(() => {

          autoSaveProject();

        }, 2000);

      alert(
        `Translation applied successfully. Project language changed to ${targetLanguage}.`
      );
    };

  // ============================================================
  // INVITE COLLABORATOR
  // ============================================================

  const inviteCollaborator =
    async () => {

      if (
        !collaboratorEmail.trim()
      ) {

        alert(
          "Please enter an email address."
        );

        return;
      }

      try {

        setInviting(true);

        await API.post(
          "/collaborators/invite",
          {
            project_id:
              Number(id),

            email:
              collaboratorEmail.trim()
          }
        );

        alert(
          "Collaborator invited successfully!"
        );

        setCollaboratorEmail("");

        await loadCollaborators();

      } catch (err) {

        console.log(
          "Invite error:",
          err
        );

        if (
          err.response?.data?.detail
        ) {

          alert(
            err.response.data.detail
          );

        } else {

          alert(
            "Unable to invite collaborator."
          );
        }

      } finally {

        setInviting(false);
      }
    };

  // ============================================================
  // MONACO LANGUAGE
  // ============================================================

  const getMonacoLanguage =
    () => {

      if (!project?.language) {
        return "python";
      }

      switch (
        project.language.toLowerCase()
      ) {

        case "python":
          return "python";

        case "java":
          return "java";

        case "c":
          return "c";

        case "c++":
          return "cpp";

        default:
          return "plaintext";
      }
    };

  // ============================================================
  // LOADING
  // ============================================================

  if (!project) {

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-xl font-semibold mb-2">
            Loading project...
          </div>

          <p className="text-gray-500">
            Please wait
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="min-h-16 bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="text-gray-300 hover:text-white transition"
          >
            ← Dashboard
          </button>

          <div className="h-6 w-px bg-slate-600"></div>

          <div>

            <h1 className="text-lg font-bold">
              {project.title}
            </h1>

            <p className="text-xs text-gray-400">
              Project ID: {id}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* LANGUAGE */}

          <select
            value={
              project.language ||
              "Python"
            }
            onChange={(e) =>
              changeLanguage(
                e.target.value
              )
            }
            className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            {languages.map(
              (language) => (

                <option
                  key={language}
                  value={language}
                >
                  {language}
                </option>

              )
            )}

          </select>

          {/* TRANSLATE */}

          <button
            onClick={
              openTranslate
            }
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            🔄 Translate
          </button>

          {/* SHARE */}

          <button
            onClick={() => {

              setShowShare(true);

              loadCollaborators();

            }}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            👥 Share
          </button>

          {/* SAVE */}

          <button
            onClick={
              saveProject
            }
            disabled={
              saving || saved
            }
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-sm transition"
          >

            {saving
              ? "Saving..."
              : saved
              ? "✓ Saved"
              : "💾 Save"}

          </button>

          {/* RUN */}

          <button
            onClick={
              runCode
            }
            disabled={
              running
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-sm transition"
          >

            {running
              ? "Running..."
              : "▶ Run"}

          </button>

        </div>

      </header>

      {/* ======================================================
          EDITOR AREA
      ====================================================== */}

      <div className="flex-1 flex flex-col">

        {/* EDITOR STATUS BAR */}

        <div className="bg-slate-900 border-b border-slate-700 px-5 py-2 flex justify-between items-center">

          <div className="flex items-center gap-3">

            <span className="text-sm text-gray-400">
              {project.title}
            </span>

            <span className="text-xs px-2 py-1 rounded bg-slate-700 text-blue-400">
              {project.language}
            </span>

          </div>

          <div className="flex items-center gap-3 flex-wrap">

            {/* SAVE STATUS */}

            {saving ? (

              <span className="text-xs text-blue-400">
                ● Saving...
              </span>

            ) : saved ? (

              <span className="text-xs text-green-400">
                ✓ Saved
              </span>

            ) : (

              <span className="text-xs text-yellow-400">
                ● Unsaved changes
              </span>

            )}

            {/* WEBSOCKET STATUS */}

            <span
              className={`text-xs px-2 py-1 rounded ${
                connectionStatus ===
                "Connected"
                  ? "bg-green-900/40 text-green-400"
                  : connectionStatus ===
                    "Connecting..."
                  ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              ● {connectionStatus}
            </span>

            {/* ONLINE USERS */}

            <div className="flex items-center gap-2">

              <span className="text-xs text-gray-400">
                👥 {onlineUsers.length} Online
              </span>

              <div className="flex items-center -space-x-2">

                {onlineUsers.map(
                  (userId) => (

                    <div
                      key={userId}
                      title={
                        userId ===
                        JSON.parse(
                          localStorage.getItem(
                            "user"
                          )
                        )?.id
                          ? "You"
                          : `User ${userId}`
                      }
                      className="w-7 h-7 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
                    >
                      {userId}
                    </div>

                  )
                )}

              </div>

            </div>

            <span className="text-xs text-gray-500">
              Monaco Editor
            </span>

          </div>

        </div>

        {/* EDITOR + AI */}

        <div className="flex flex-col xl:flex-row flex-1 min-h-0">

          <div className="flex-1">

            <MonacoEditor
              height="60vh"
              language={
                getMonacoLanguage()
              }
              theme="vs-dark"
              value={code}
              onChange={
                handleCodeChange
              }
              options={{
                fontSize: 15,

                minimap: {
                  enabled: true
                },

                automaticLayout: true,

                padding: {
                  top: 10
                },

                scrollBeyondLastLine:
                  false,

                wordWrap: "on",

                suggestOnTriggerCharacters:
                  true,

                quickSuggestions:
                  true,

                tabSize: 4,

                insertSpaces: true,

                formatOnPaste: true,

                formatOnType: false
              }}
            />

          </div>

          <AIAssistant
            code={code}
            language={
              project.language ||
              "Python"
            }
          />

        </div>

        {/* ==================================================
            TERMINAL
        ================================================== */}

        <div className="bg-slate-950 border-t border-slate-700">

          <div className="flex justify-between items-center px-5 py-3 bg-slate-900 border-b border-slate-800">

            <div className="flex items-center gap-2">

              <span className="text-green-400 font-mono text-sm">
                ▶
              </span>

              <span className="text-sm font-semibold text-gray-200">
                TERMINAL / OUTPUT
              </span>

              {running && (

                <span className="text-yellow-400 text-xs ml-2 animate-pulse">
                  ● Running...
                </span>

              )}

            </div>

            <button
              onClick={
                clearOutput
              }
              className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-slate-700 transition"
            >
              Clear
            </button>

          </div>

          <div className="h-40 overflow-auto p-4 font-mono text-sm">

            {output ? (

              <pre className="text-green-400 whitespace-pre-wrap leading-6">
                {output}
              </pre>

            ) : (

              <div className="text-gray-600">

                <span className="text-green-500">
                  codeverse
                </span>

                <span className="text-gray-600">
                  :~$
                </span>

                <span className="ml-2">
                  Program output will appear here...
                </span>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================
          TRANSLATION WINDOW
      ====================================================== */}

      {showTranslate && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">

              <div>

                <h2 className="text-xl font-bold">
                  🔄 Translate Code
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Convert your code to another programming language
                </p>

              </div>

              <button
                onClick={() =>
                  setShowTranslate(
                    false
                  )
                }
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>

            </div>

            {!showTranslationPreview ? (

              <div className="p-6">

                <div className="mb-5">

                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Language
                  </label>

                  <div className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-blue-400 font-semibold">
                    {project.language}
                  </div>

                </div>

                <div className="mb-5">

                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Translate To
                  </label>

                  <select
                    value={
                      targetLanguage
                    }
                    onChange={(e) =>
                      setTargetLanguage(
                        e.target.value
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >

                    {languages
                      .filter(
                        (language) =>
                          language !==
                          project.language
                      )
                      .map(
                        (language) => (

                          <option
                            key={language}
                            value={language}
                          >
                            {language}
                          </option>

                        )
                      )}

                  </select>

                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-5">

                  <div className="flex items-center justify-center gap-4">

                    <span className="text-blue-400 font-semibold">
                      {project.language}
                    </span>

                    <span className="text-gray-500">
                      →
                    </span>

                    <span className="text-green-400 font-semibold">
                      {targetLanguage}
                    </span>

                  </div>

                </div>

                <div className="flex justify-end gap-3">

                  <button
                    onClick={() =>
                      setShowTranslate(
                        false
                      )
                    }
                    className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={
                      translateCode
                    }
                    disabled={
                      translating
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-semibold transition"
                  >
                    {translating
                      ? "Translating..."
                      : "🔄 Translate"}
                  </button>

                </div>

              </div>

            ) : (

              <div className="p-6">

                <div className="flex items-center justify-between mb-3">

                  <h3 className="font-semibold">
                    Translation Preview
                  </h3>

                  <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-300">
                    {project.language}
                    {" → "}
                    {targetLanguage}
                  </span>

                </div>

                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 max-h-96 overflow-auto">

                  <pre className="text-sm text-green-300 whitespace-pre-wrap font-mono">
                    {translatedCode}
                  </pre>

                </div>

                <div className="flex justify-end gap-3 mt-5">

                  <button
                    onClick={() => {

                      setShowTranslationPreview(
                        false
                      );

                      setTranslatedCode(
                        ""
                      );

                    }}
                    className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg transition"
                  >
                    Back
                  </button>

                  <button
                    onClick={
                      applyTranslation
                    }
                    className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg font-semibold transition"
                  >
                    ✓ Apply Translation
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

      {/* ======================================================
          SHARE WINDOW
      ====================================================== */}

      {showShare && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">

              <div>

                <h2 className="text-xl font-bold">
                  👥 Share Project
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Invite users to collaborate on this project
                </p>

              </div>

              <button
                onClick={() =>
                  setShowShare(
                    false
                  )
                }
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Email
              </label>

              <div className="flex gap-2">

                <input
                  type="email"
                  value={
                    collaboratorEmail
                  }
                  onChange={(e) =>
                    setCollaboratorEmail(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key ===
                      "Enter"
                    ) {
                      inviteCollaborator();
                    }

                  }}
                  placeholder="Enter registered user's email"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <button
                  onClick={
                    inviteCollaborator
                  }
                  disabled={
                    inviting
                  }
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition"
                >
                  {inviting
                    ? "Inviting..."
                    : "Invite"}
                </button>

              </div>

              <p className="text-xs text-gray-500 mt-2">
                The user must already have a CodeVerse account.
              </p>

            </div>

            <div className="border-t border-slate-700">

              <div className="px-6 py-4">

                <h3 className="font-semibold text-white mb-3">
                  Collaborators
                </h3>

                {loadingCollaborators ? (

                  <p className="text-sm text-gray-500">
                    Loading collaborators...
                  </p>

                ) : collaborators.length ===
                  0 ? (

                  <p className="text-sm text-gray-500">
                    No collaborators yet.
                  </p>

                ) : (

                  <div className="space-y-2 max-h-48 overflow-auto">

                    {collaborators.map(
                      (collaborator) => (

                        <div
                          key={
                            collaborator.id
                          }
                          className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                              👤
                            </div>

                            <div>

                              <p className="text-sm font-medium">
                                User ID:{" "}
                                {
                                  collaborator.user_id
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                Collaborator
                              </p>

                            </div>

                          </div>

                          <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-300">
                            {
                              collaborator.role
                            }
                          </span>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end">

              <button
                onClick={() =>
                  setShowShare(
                    false
                  )
                }
                className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg transition"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}