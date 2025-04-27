import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import GraphViewer from "../graph/GraphViewer";

const NotebookMainContent = ({
  notebook,
  topics,
  resources, // Add this prop
  loading,
  onAddTopic,
  onDeleteTopic,
}) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (topicId) => {
    if (deleting) return;

    try {
      setDeleting(true);
      await onDeleteTopic(topicId);
      toast.success("Topic deleted successfully");
    } catch (error) {
      console.error("Error in delete handler:", error);
      toast.error("Failed to delete topic");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
      setDeletingTopicId(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Stats Section - Fixed */}
      <div className="flex w-full gap-10 h-[65%]">
        <div className="flex flex-col gap-5 w-[40%] h-full">
          {/* Welcome Card */}
          <div
            className="flex flex-col items-start justify-center p-8 w-full h-[45%] rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${assets.WelcomeCard})` }}
          >
            <h2 className="text-4xl font-normal text-[#BFA7FF] drop-shadow-md">
              Welcome to
            </h2>
            <h1 className="text-5xl font-semibold text-base-white drop-shadow-lg text-nowrap">
              {notebook?.name || "Notebook"}
            </h1>
          </div>

          {/* Progress Section */}
          <div
            className="w-full h-[65%] flex flex-col rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${assets.ProgressSection})` }}
          >
            <div className="flex flex-col gap-10 text-[#309B59] justify-between items-end p-8 h-full rounded-xl">
              <div className="flex w-full relative items-center justify-between h-[60%]">
                <h2 className="text-3xl absolute bottom-[-20px] font-medium">
                  Total Topics
                </h2>
                <h1 className="text-9xl absolute right-0 font-semibold drop-shadow-lg text-nowrap">
                  {topics?.length || 0}
                </h1>
              </div>
              <div className="flex pr-16 justify-between items-end w-full h-[40%]">
                <div className="flex flex-col items-center">
                  <h1 className="text-4xl font-semibold">🔥20</h1>
                  <h2 className="pl-4">Days Streak</h2>
                </div>
                <div>
                  <h1 className="text-4xl font-semibold">⌛15</h1>
                  <h2 className="pl-2">Total Hours</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <div className="w-[60%] h-full rounded-xl bg-white/5">
          <GraphViewer
            notebooks={notebook ? [notebook] : []}
            topics={topics || []}
            resources={resources || []} // Use the resources prop directly
          />
        </div>
      </div>

      {/* Topics Grid - Scrollable */}
      <div className="w-full h-[35%] pt-5 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {/* Topic Cards */}
                {topics?.map((topic) => (
                  <div
                    key={topic._id}
                    onClick={() => navigate(`/dashboard/topic/${topic._id}`)}
                    className="group relative h-[200px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      <img
                        src={topic.path || assets.defaultTopic}
                        alt={topic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = assets.defaultTopic;
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 p-4 w-full">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {topic.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/topic/${topic._id}`);
                        }}
                        className="text-sm text-white/80 hover:text-white transition-colors"
                      >
                        Open →
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTopicId(topic._id);
                          setShowConfirm(true);
                        }}
                        disabled={deleting}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!topics || topics.length === 0) && !loading && (
                  <div className="text-center py-12 col-span-3">
                    <p className="text-gray-500">
                      No topics yet. Create your first one!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          <div className="relative bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Delete Topic?</h3>
            <p className="mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingTopicId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookMainContent;
