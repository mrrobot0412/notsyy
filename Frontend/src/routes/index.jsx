import { createBrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import NotebookDashboard from "../pages/NotebookDashboard";
import TopicDashboard from "../pages/TopicDashboard";
import ResourceViewerPage from "../pages/ResourceViewerPage";
import GraphViewPage from "../pages/GraphViewPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "notebook/:notebookId",
        element: <NotebookDashboard />,
      },
      {
        path: "topic/:topicId",
        element: <TopicDashboard />,
      },
      {
        path: "resource/:resourceId",
        element: <ResourceViewerPage />,
      },
      {
        path: "graph-view",
        element: <GraphViewPage />,
      },
    ],
  },
]);

export default router;
