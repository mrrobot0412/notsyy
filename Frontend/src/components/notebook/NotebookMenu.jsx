import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { assets } from '../../assets/assets';
import { LuNotebook } from "react-icons/lu";
import { FaAngleDown } from "react-icons/fa";

const NotebookMenu = ({ notebook, topics = [], loading, onAddTopicClick }) => {
  const navigate = useNavigate();

  const handleTopicClick = (topicId) => {
    navigate(`/dashboard/topic/${topicId}`);
  };

  return (
    <div className="h-full relative flex flex-col min-w-64">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <img className="w-6 h-6" src={assets.logo} alt="Logo" />
          <h1 className="text-3xl font-bold">{notebook?.name || 'Notebook'}</h1>
        </div>

        <button
          onClick={onAddTopicClick}
          className="flex bg-primary items-center gap-2 w-full p-4 text-sm font-medium text-base-white hover:bg-primary-hover rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Topic
        </button>

        <div className="w-full h-4 mt-4">
          <img className="w-full h-full" src={assets.Seprator} alt="" />
        </div>

        <nav className="mt-4">
          <p className="mb-4">Topics</p>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ul className="space-y-4">
              {topics.map((topic) => (
                <li key={topic._id}>
                  <button
                    onClick={() => handleTopicClick(topic._id)}
                    className="flex items-center justify-between w-full bg-cover text-primary-hover bg-center p-4 text-left text-sm font-bold tracking-wide hover:bg-primary/20 rounded-xl transition-colors"
                    style={{ backgroundImage: `url(${assets.Listbg})` }}
                  >
                    <div className="flex gap-2">
                      <LuNotebook size={18} />
                      {topic.title}
                    </div>
                    <FaAngleDown />
                  </button>
                </li>
              ))}
              
              {(!topics || topics.length === 0) && (
                <p className="text-center text-gray-500 py-4">
                  No topics yet. Create your first one!
                </p>
              )}
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
};

export default NotebookMenu;