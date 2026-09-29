import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();

  // --------------------------------------------------
  // USER
  // --------------------------------------------------

  const [currentUser, setCurrentUser] = useState(null);

  // --------------------------------------------------
  // PROJECTS
  // --------------------------------------------------

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [search, setSearch] = useState("");

  // --------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------

  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const notificationSocketRef = useRef(null);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const [activeSection, setActiveSection] = useState("dashboard");

  // --------------------------------------------------
  // LOAD USER
  // --------------------------------------------------

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser?.id) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/", { replace: true });
        return;
      }

      setCurrentUser(parsedUser);
    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/", { replace: true });
    }
  }, [navigate]);

  // --------------------------------------------------
  // LOAD PROJECTS
  // --------------------------------------------------

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await API.get("/projects/");

      setProjects(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadProjects();
  }, [currentUser]);

  // --------------------------------------------------
  // LOAD INVITATIONS
  // --------------------------------------------------

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);

      const response = await API.get("/collaborations/");

      setInvitations(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load invitations:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadInvitations();
  }, [currentUser]);

  // --------------------------------------------------
  // NOTIFICATION WEBSOCKET
  // --------------------------------------------------

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const userId = Number(currentUser.id);

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/collaborations/notifications/ws/${userId}`
    );

    notificationSocketRef.current = socket;

    socket.onopen = () => {
      console.log("Notification WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notification") {
          const newNotification = {
            id: Date.now(),
            message: data.message,
          };

          setNotifications((previousNotifications) => [
            newNotification,
            ...previousNotifications,
          ]);

          // Refresh invitations so the new pending invitation
          // appears without manually refreshing the page.
          loadInvitations();
        }
      } catch (error) {
        console.error(
          "Notification message error:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "Notification WebSocket error:",
        error
      );
    };

    socket.onclose = () => {
      console.log(
        "Notification WebSocket disconnected"
      );
    };

    return () => {
      socket.close();
      notificationSocketRef.current = null;
    };
  }, [currentUser]);

  // --------------------------------------------------
  // ACCEPT INVITATION
  // --------------------------------------------------

  const acceptInvitation = async (invitationId) => {
    try {
      await API.put(
        `/collaborations/${invitationId}/accept`
      );

      alert("Invitation accepted successfully.");

      await loadInvitations();
      await loadProjects();

      setActiveSection("projects");
    } catch (error) {
      console.error(
        "Accept invitation error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Failed to accept invitation."
      );
    }
  };

  // --------------------------------------------------
  // REJECT INVITATION
  // --------------------------------------------------

  const rejectInvitation = async (invitationId) => {
    try {
      await API.put(
        `/collaborations/${invitationId}/reject`
      );

      alert("Invitation rejected.");

      await loadInvitations();
    } catch (error) {
      console.error(
        "Reject invitation error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Failed to reject invitation."
      );
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (notificationSocketRef.current) {
      notificationSocketRef.current.close();
    }

    navigate("/", { replace: true });
  };

  // --------------------------------------------------
  // DELETE PROJECT
  // --------------------------------------------------

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/projects/${projectId}`);

      alert("Project deleted successfully.");

      await loadProjects();
    } catch (error) {
      console.error(
        "Delete project error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Failed to delete project."
      );
    }
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredProjects = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.title
          ?.toLowerCase()
          .includes(searchValue) ||
        project.language
          ?.toLowerCase()
          .includes(searchValue) ||
        project.description
          ?.toLowerCase()
          .includes(searchValue)
      );
    });
  }, [projects, search]);

  // --------------------------------------------------
  // COLLABORATIVE PROJECTS
  // --------------------------------------------------

  const collaboratorProjects = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return projects.filter(
      (project) =>
        Number(project.owner_id) !==
        Number(currentUser.id)
    );
  }, [projects, currentUser]);

  // --------------------------------------------------
  // OWNED PROJECTS
  // --------------------------------------------------

  const ownedProjects = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return projects.filter(
      (project) =>
        Number(project.owner_id) ===
        Number(currentUser.id)
    );
  }, [projects, currentUser]);

  // --------------------------------------------------
  // PENDING INVITATIONS
  // --------------------------------------------------

  const pendingInvitations = useMemo(() => {
    return invitations.filter(
      (invitation) =>
        invitation.status?.toLowerCase() ===
        "pending"
    );
  }, [invitations]);

  // --------------------------------------------------
  // NOTIFICATION COUNT
  // --------------------------------------------------

  const notificationCount =
    pendingInvitations.length +
    notifications.length;

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const openSection = (section) => {
    setActiveSection(section);
  };

  // --------------------------------------------------
  // LOADING USER
  // --------------------------------------------------

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-lg">
          Loading CodeVerse...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen fixed left-0 top-0">

        {/* LOGO */}

        <div className="px-6 py-6 border-b border-slate-800">

          <h1 className="text-2xl font-bold text-blue-400">
            CodeVerse
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Collaborative Coding Platform
          </p>

        </div>

        {/* USER */}

        <div className="px-6 py-5 border-b border-slate-800">

          <p className="text-gray-400 text-xs">
            Logged in as
          </p>

          <p className="text-white font-semibold mt-1 truncate">
            {currentUser.username}
          </p>

          <p className="text-gray-500 text-xs truncate mt-1">
            {currentUser.email}
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="p-4 space-y-2">

          <button
            onClick={() =>
              openSection("dashboard")
            }
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeSection === "dashboard"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() =>
              openSection("projects")
            }
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeSection === "projects"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Projects
          </button>

          <button
            onClick={() =>
              openSection("collaborators")
            }
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeSection === "collaborators"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Collaborators
          </button>

          <button
            onClick={() =>
              openSection("notifications")
            }
            className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
              activeSection === "notifications"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>
              Notifications
            </span>

            {pendingInvitations.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {pendingInvitations.length}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              navigate("/profile")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition"
          >
            Profile
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
          >
            Logout
          </button>

        </nav>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="ml-64 flex-1">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">

          <div>

            <h2 className="text-xl font-semibold">
              {activeSection === "dashboard" &&
                "Dashboard"}

              {activeSection === "projects" &&
                "Projects"}

              {activeSection === "collaborators" &&
                "Collaborators"}

              {activeSection === "notifications" &&
                "Notifications"}
            </h2>

          </div>

          <div className="flex items-center gap-4">

            {/* NOTIFICATION BUTTON */}

            <button
              onClick={() =>
                openSection("notifications")
              }
              className="relative p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              title="Notifications"
            >
              <span className="text-xl">
                🔔
              </span>

              {pendingInvitations.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                  {pendingInvitations.length}
                </span>
              )}
            </button>

            {/* CREATE PROJECT */}

            <button
              onClick={() =>
                navigate("/create-project")
              }
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-semibold transition"
            >
              + New Project
            </button>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="p-8">

          {/* =================================================
              DASHBOARD SECTION
          ================================================= */}

          {activeSection === "dashboard" && (
            <>

              {/* WELCOME */}

              <div className="mb-8">

                <h1 className="text-3xl font-bold">
                  Welcome,{" "}
                  <span className="text-blue-400">
                    {currentUser.username}
                  </span>
                  !
                </h1>

                <p className="text-gray-400 mt-2">
                  Manage your coding projects and
                  collaborate with other programmers.
                </p>

              </div>

              {/* STATS */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* TOTAL PROJECTS */}

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                  <p className="text-gray-400 text-sm">
                    Total Projects
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {projects.length}
                  </p>

                </div>

                {/* OWNED PROJECTS */}

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                  <p className="text-gray-400 text-sm">
                    My Projects
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {ownedProjects.length}
                  </p>

                </div>

                {/* COLLABORATIONS */}

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                  <p className="text-gray-400 text-sm">
                    Collaborations
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {collaboratorProjects.length}
                  </p>

                </div>

              </div>

              {/* PENDING INVITATION NOTICE */}

              {pendingInvitations.length > 0 && (
                <div className="bg-blue-950/40 border border-blue-800 rounded-xl p-5 mb-8">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-semibold text-blue-300">
                        You have{" "}
                        {pendingInvitations.length}{" "}
                        pending collaboration invitation
                        {pendingInvitations.length !== 1
                          ? "s"
                          : ""}
                      </h3>

                      <p className="text-gray-400 text-sm mt-1">
                        Open Notifications to accept
                        or reject them.
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        openSection(
                          "notifications"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                    >
                      View
                    </button>

                  </div>

                </div>
              )}

              {/* RECENT PROJECTS */}

              <div>

                <div className="flex items-center justify-between mb-5">

                  <h2 className="text-xl font-semibold">
                    Recent Projects
                  </h2>

                  <button
                    onClick={() =>
                      openSection("projects")
                    }
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View all
                  </button>

                </div>

                {loadingProjects ? (
                  <p className="text-gray-400">
                    Loading projects...
                  </p>
                ) : filteredProjects.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">

                    <p className="text-gray-400">
                      No projects found.
                    </p>

                    <button
                      onClick={() =>
                        navigate(
                          "/create-project"
                        )
                      }
                      className="mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
                    >
                      Create your first project
                    </button>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    {filteredProjects
                      .slice(0, 6)
                      .map((project) => (

                        <ProjectCard
                          key={project.id}
                          project={project}
                          currentUser={currentUser}
                          onOpen={() =>
                            navigate(
                              `/editor/${project.id}`
                            )
                          }
                          onDelete={() =>
                            handleDeleteProject(
                              project.id
                            )
                          }
                        />

                      ))}

                  </div>
                )}

              </div>

            </>
          )}

          {/* =================================================
              PROJECTS SECTION
          ================================================= */}

          {activeSection === "projects" && (
            <>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

                <div>

                  <h1 className="text-3xl font-bold">
                    Projects
                  </h1>

                  <p className="text-gray-400 mt-2">
                    Your projects and projects shared
                    with you.
                  </p>

                </div>

                <button
                  onClick={() =>
                    navigate(
                      "/create-project"
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-semibold"
                >
                  + New Project
                </button>

              </div>

              {/* SEARCH */}

              <div className="mb-6">

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search projects..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {loadingProjects ? (
                <p className="text-gray-400">
                  Loading projects...
                </p>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">

                  <p className="text-gray-400">
                    No matching projects.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                  {filteredProjects.map(
                    (project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currentUser={
                          currentUser
                        }
                        onOpen={() =>
                          navigate(
                            `/editor/${project.id}`
                          )
                        }
                        onDelete={() =>
                          handleDeleteProject(
                            project.id
                          )
                        }
                      />
                    )
                  )}

                </div>
              )}

            </>
          )}

          {/* =================================================
              COLLABORATORS SECTION
          ================================================= */}

          {activeSection === "collaborators" && (
            <>

              <div className="mb-8">

                <h1 className="text-3xl font-bold">
                  Collaborators
                </h1>

                <p className="text-gray-400 mt-2">
                  Projects shared with you by other
                  programmers.
                </p>

              </div>

              {collaboratorProjects.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">

                  <div className="text-4xl mb-4">
                    👥
                  </div>

                  <h3 className="text-xl font-semibold">
                    No collaborations yet
                  </h3>

                  <p className="text-gray-400 mt-2">
                    When another programmer shares a
                    project with you, it will appear here.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                  {collaboratorProjects.map(
                    (project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currentUser={currentUser}
                        onOpen={() =>
                          navigate(
                            `/editor/${project.id}`
                          )
                        }
                        showCollaboratorLabel
                      />
                    )
                  )}

                </div>
              )}

            </>
          )}

          {/* =================================================
              NOTIFICATIONS SECTION
          ================================================= */}

          {activeSection === "notifications" && (
            <>

              <div className="flex items-center justify-between mb-8">

                <div>

                  <h1 className="text-3xl font-bold">
                    Notifications
                  </h1>

                  <p className="text-gray-400 mt-2">
                    Collaboration invitations and
                    account notifications.
                  </p>

                </div>

                <button
                  onClick={loadInvitations}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg"
                >
                  Refresh
                </button>

              </div>

              {/* PENDING INVITATIONS */}

              <div className="mb-10">

                <h2 className="text-xl font-semibold mb-4">
                  Collaboration Invitations
                </h2>

                {loadingInvitations ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <p className="text-gray-400">
                      Loading invitations...
                    </p>

                  </div>
                ) : pendingInvitations.length ===
                  0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">

                    <p className="text-gray-400">
                      No pending collaboration
                      invitations.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-4">

                    {pendingInvitations.map(
                      (invitation) => (
                        <div
                          key={invitation.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                        >

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                            <div>

                              <div className="flex items-center gap-3">

                                <span className="text-2xl">
                                  🔔
                                </span>

                                <h3 className="text-lg font-semibold">
                                  Collaboration Invitation
                                </h3>

                              </div>

                              <p className="text-gray-400 mt-3">
                                You have been invited to
                                collaborate on Project{" "}
                                <span className="text-white font-medium">
                                  {invitation.project_id}
                                </span>
                                .
                              </p>

                              <p className="text-yellow-400 text-sm mt-2">
                                Status: Pending
                              </p>

                            </div>

                            <div className="flex gap-3">

                              <button
                                onClick={() =>
                                  acceptInvitation(
                                    invitation.id
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-lg font-semibold"
                              >
                                Accept
                              </button>

                              <button
                                onClick={() =>
                                  rejectInvitation(
                                    invitation.id
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg font-semibold"
                              >
                                Reject
                              </button>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              {/* REAL-TIME NOTIFICATIONS */}

              <div>

                <h2 className="text-xl font-semibold mb-4">
                  Recent Notifications
                </h2>

                {notifications.length ===
                0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">

                    <p className="text-gray-400">
                      No new notifications during this
                      session.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-3">

                    {notifications.map(
                      (notification) => (
                        <div
                          key={notification.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4"
                        >

                          <span className="text-xl">
                            🔔
                          </span>

                          <p className="text-gray-300">
                            {notification.message}
                          </p>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </>
          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-slate-800 px-8 py-6 text-center text-gray-500 text-sm">

          CodeVerse — Collaborative Coding Platform

        </footer>

      </main>

    </div>
  );
}


// ========================================================
// PROJECT CARD
// ========================================================

function ProjectCard({
  project,
  currentUser,
  onOpen,
  onDelete,
  showCollaboratorLabel = false,
}) {
  const isOwner =
    Number(project.owner_id) ===
    Number(currentUser.id);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <h3 className="text-lg font-semibold truncate">
            {project.title}
          </h3>

          <span className="inline-block mt-2 text-xs bg-blue-950 text-blue-300 px-2.5 py-1 rounded-md">
            {project.language}
          </span>

        </div>

        {showCollaboratorLabel && (
          <span className="text-xs text-green-400 bg-green-950/40 px-2 py-1 rounded-md">
            Collaborator
          </span>
        )}

      </div>

      {/* DESCRIPTION */}

      <p className="text-gray-400 text-sm mt-4 min-h-10">
        {project.description ||
          "No description provided."}
      </p>

      {/* OWNER */}

      <div className="mt-5 text-xs text-gray-500">

        {isOwner ? (
          <span>
            Owner: You
          </span>
        ) : (
          <span>
            Shared project
          </span>
        )}

      </div>

      {/* ACTIONS */}

      <div className="flex gap-3 mt-5">

        <button
          onClick={onOpen}
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium transition"
        >
          Open
        </button>

        {isOwner && onDelete && (
          <button
            onClick={onDelete}
            className="px-4 bg-red-950/50 hover:bg-red-900/70 text-red-400 py-2 rounded-lg transition"
          >
            Delete
          </button>
        )}

      </div>

    </div>
  );
}