import React, { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { LuNotebook } from "react-icons/lu";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

const Menu = ({ notebooks = [], topics = {}, loading, onAddNotebookClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expandedNotebook, setExpandedNotebook] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/"); // Changed from /auth/login to /
  };

  const handleNotebookClick = (e, notebookId) => {
    // If clicking the arrow icon, toggle expansion
    if (e.target.closest('.expand-icon')) {
      e.stopPropagation();
      setExpandedNotebook(expandedNotebook === notebookId ? null : notebookId);
      return;
    }

    // Otherwise navigate to notebook dashboard
    navigate(`/dashboard/notebook/${notebookId}`);
  };

  const handleTopicClick = (e, topicId) => {
    e.stopPropagation();
    navigate(`/dashboard/topic/${topicId}`);
  };

  return (
    <div className="h-full relative flex flex-col min-w-64">
      <div className="p-6 flex flex-col h-full">
        {/* Logo and Add Button - Fixed */}
        <div className="flex-none">
          <div className="flex items-center gap-2 mb-8">
            <img className="w-6 h-6" src={assets.logo} alt="Logo" />
            <h1 className="text-3xl font-bold">NOTSY</h1>
          </div>

          <button
            onClick={onAddNotebookClick}
            className="flex bg-primary items-center gap-2 w-full p-4 text-sm font-medium text-base-white hover:bg-primary-hover rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Notebook
          </button>

          <div className="w-full h-4 mt-4">
            <img className="w-full h-full" src={assets.Seprator} alt="" />
          </div>
        </div>

        {/* Notebooks List with Topics */}
        <nav className="mt-4 flex-1 min-h-0">
          <p className="mb-4">Recent</p>
          <div className="h-[calc(100%-2rem)] overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ul className="space-y-4 pr-2">
                {notebooks.map((notebook) => (
                  <li key={notebook._id}>
                    <div className="space-y-2">
                      <button
                        onClick={(e) => handleNotebookClick(e, notebook._id)}
                        className="flex items-center justify-between w-full bg-cover text-primary-hover bg-center p-4 text-left text-sm font-bold tracking-wide hover:bg-primary/20 rounded-xl transition-colors"
                        style={{ backgroundImage: `url(${assets.Listbg})` }}
                      >
                        <div className="flex gap-2">
                          <LuNotebook size={18} />
                          {notebook.name}
                        </div>
                        <div className="expand-icon">
                          {expandedNotebook === notebook._id ? (
                            <FaAngleUp />
                          ) : (
                            <FaAngleDown />
                          )}
                        </div>
                      </button>
                      
                      {/* Expanded Topics */}
                      {expandedNotebook === notebook._id && (
                        <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-2">
                          {topics[notebook._id]?.length > 0 ? (
                            topics[notebook._id].map(topic => (
                              <button
                                key={topic._id}
                                onClick={(e) => handleTopicClick(e, topic._id)}
                                className="w-full text-left p-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <span className="w-1 h-1 rounded-full bg-primary/60"></span>
                                {topic.title}
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 p-2">
                              No topics yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Profile Section */}
        <div
          className="flex gap-4 absolute w-52 h-40 flex-col bottom-6 bg-cover items-center bg-center px-2 py-5 text-primary-hover rounded-xl hover:bg-primary-hover/20 transition-all"
          style={{ backgroundImage: `url(${assets.Listbg})` }}
        >
          <div className="flex w-full text-nowrap items-center gap-2 px-2">
            <img className="h-10" src={assets.profile} alt="" />
            <h1 className="font-bold text-md">
              {user?.name || "User"}
            </h1>
          </div>
          <p className="text-sm">{user?.email}</p>
          <button 
            onClick={handleLogout}
            className="flex justify-center items-center w-full px-4 rounded-xl py-2 text-base-white bg-[#FF4F5B]"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
