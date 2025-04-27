import React from "react";
import { useNavigate } from "react-router-dom";

const TopicMenu = ({ topic, resources, loading }) => {
  const navigate = useNavigate();

  const getVideoIdFromUrl = (url) => {
    try {
      return new URL(url).searchParams.get('v');
    } catch {
      return null;
    }
  };

  const handleResourceClick = (resourceId) => {
    navigate(`/dashboard/resource/${resourceId}`);
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header - Fixed */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {topic?.title || "Topic"}
        </h2>
      </div>

      {/* Resources List - Scrollable */}
      <div className="flex-1 min-h-0"> {/* min-h-0 is important for flex child scrolling */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">Resources</h3>
        <div className="h-full overflow-y-auto pr-2 space-y-3">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : resources?.length > 0 ? (
            resources.map((resource) => {
              const videoId = getVideoIdFromUrl(Array.isArray(resource.source) ? resource.source[0] : resource.source);
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

              return (
                <button
                  key={resource._id}
                  onClick={() => handleResourceClick(resource._id)}
                  className="flex items-center w-full p-2 text-left rounded-lg hover:bg-white/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-12 flex-shrink-0 mr-3 overflow-hidden rounded-md">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl">🎥</span>
                      </div>
                    )}
                  </div>

                  {/* Title and URL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {resource.title || "Video Resource"}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {Array.isArray(resource.source) ? resource.source[0] : resource.source}
                    </p>
                  </div>

                  {/* Right arrow icon */}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No resources added yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicMenu;