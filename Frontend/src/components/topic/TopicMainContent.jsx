import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { assets } from "../../assets/assets";
import ResourceUploadSection from './ResourceUploadSection';
import axios from "../../utils/axios";
import { toast } from "react-hot-toast";
import { uploadPDFs } from '../../services/resourceService';

const ResourceCard = ({ resource, onClick }) => {
  const getVideoIdFromUrl = (url) => {
    try {
      return new URL(url).searchParams.get('v');
    } catch {
      return null;
    }
  };

  // Get first URL if it's an array
  const sourceUrl = Array.isArray(resource.source) ? resource.source[0] : resource.source;
  const videoId = getVideoIdFromUrl(sourceUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : assets.defaultThumbnail;
  
  // Get video count if multiple sources
  const additionalCount = Array.isArray(resource.source) ? resource.source.length - 1 : 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative pt-[56.25%]">
        <img 
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {additionalCount > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
            +{additionalCount}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-800 truncate">
          {resource.title || "Video Resource"}
        </h3>
        <p className="text-sm text-gray-500 truncate mt-1">
          {sourceUrl}
        </p>
      </div>
    </div>
  );
};

const TopicMainContent = ({ topic, resources, loading, onResourcesUpdate }) => {
  const { topicId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Add loading check for both auth and topic data
  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Verify we have both topic data and ID
  if (!topic || !topicId) {
    return <div className="flex justify-center items-center h-full">
      <p className="text-red-500">Topic not found</p>
    </div>;
  }

  const handleVideoSubmit = async (urls) => {
    try {
      // Start loading toast
      toast.loading("Processing videos...", { id: "uploadToast" });

      const response = await axios.post("/upload/uploadUrl", {
        urls,
        topicId
      });

      // Check for successful response based on backend format from video.json
      if (response.data.data && response.data.message) {
        // Update success toast with processing results
        toast.success(response.data.message, { id: "uploadToast" });
        
        // Update resources list first
        if (onResourcesUpdate) {
          await onResourcesUpdate();
        }

        // Small delay before navigation to ensure toast and updates are visible
        setTimeout(() => {
          navigate(`/dashboard/resource/${response.data.data._id}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error uploading videos:", error);
      const errorMsg = error.response?.data?.msg || "Failed to upload videos";
      toast.error(errorMsg, { id: "uploadToast" });
    }
  };

  const handlePDFSubmit = async (response) => { // Change parameter name to response
    const loadingToast = toast.loading('Processing PDFs...');
    
    try {
      if (!response?.data?._id) {
        throw new Error('Invalid response from server');
      }
      
      toast.success('PDFs uploaded successfully', { id: loadingToast });
      
      // Update resources list
      if (onResourcesUpdate) {
        await onResourcesUpdate();
      }

      // Navigate to resource viewer
      setTimeout(() => {
        navigate(`/dashboard/resource/${response.data._id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing PDFs:', error);
      toast.error(
        error.message || 'Failed to process PDFs', 
        { id: loadingToast }
      );
    }
  };

  const handleResourceClick = (resourceId) => {
    navigate(`/dashboard/resource/${resourceId}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Upload Section - Fixed height */}
      <div className="h-[300px] mb-6">
        {user ? (
          <ResourceUploadSection 
            onVideoSubmit={handleVideoSubmit}
            onPDFSubmit={handlePDFSubmit}
            topicId={topicId}
          />
        ) : (
          <div className="text-center p-4">
            Please log in to upload resources
          </div>
        )}
      </div>

      {/* Resources Grid - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden"> {/* min-h-0 enables flex child scrolling */}
        <h2 className="text-xl font-semibold mb-4">Resources</h2>
        <div className="h-[calc(100%-2rem)] overflow-y-auto scrollbar-hide pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : resources?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No resources added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicMainContent;