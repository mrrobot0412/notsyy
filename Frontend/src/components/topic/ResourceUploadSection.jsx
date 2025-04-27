import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { uploadPDFs } from '../../services/resourceService';

const MAX_URLS = 5;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getYoutubeInfo = (url) => {
  try {
    const videoUrl = new URL(url);
    const videoId = videoUrl.searchParams.get("v");
    return {
      id: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      title: url.split("v=")[1].split("&")[0], // Basic title from video ID
    };
  } catch {
    return null;
  }
};

const ResourceUploadSection = ({ onVideoSubmit, onPDFSubmit, topicId }) => {
  const [urls, setUrls] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [submittingVideos, setSubmittingVideos] = useState(false);
  const [submittingPDFs, setSubmittingPDFs] = useState(false);

  // Add logging to verify topicId is received
  console.log("ResourceUploadSection received topicId:", topicId);

  // URL handling
  const handleUrlAdd = () => {
    if (urls.length >= MAX_URLS) {
      toast.error(`Maximum ${MAX_URLS} videos allowed`);
      return;
    }

    if (!currentUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    const videoInfo = getYoutubeInfo(currentUrl.trim());
    if (!videoInfo) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    // Check for duplicate URLs
    if (urls.includes(currentUrl.trim())) {
      toast.error("This video has already been added");
      return;
    }

    setUrls([...urls, currentUrl.trim()]);
    setCurrentUrl("");
  };

  const handleVideoSubmit = async () => {
    if (!topicId) {
      toast.error("Missing topic information");
      return;
    }

    if (urls.length === 0) {
      toast.error("Please add at least one video URL");
      return;
    }

    try {
      setSubmittingVideos(true);
      // Log the URLs being sent
      console.log('Submitting URLs:', urls);
      
      await onVideoSubmit(urls);
      toast.success(`Successfully uploaded ${urls.length} videos`);
      setUrls([]);
    } catch (error) {
      console.error("Video submission failed:", error, error.response?.data);
      toast.error(error.response?.data?.msg || "Failed to submit videos");
    } finally {
      setSubmittingVideos(false);
    }
  };

  // File handling
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} PDFs allowed`);
        return;
      }

      const newFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf" && file.size <= MAX_FILE_SIZE
      );

      if (newFiles.length !== acceptedFiles.length) {
        toast.error("Only PDFs under 10MB are allowed");
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE,
  });

  const handlePDFSubmit = async () => {
    if (!topicId) {
      toast.error("Missing topic information");
      return;
    }

    if (files.length === 0) {
      toast.error("Please add at least one PDF");
      return;
    }

    const filesArray = Array.from(files);

    try {
      setSubmittingPDFs(true);
      // Get response from uploadPDFs service
      const response = await uploadPDFs(filesArray, topicId);
      
      setFiles([]); // Clear files after successful upload
      toast.success(`Successfully uploaded ${filesArray.length} PDFs`);
      
      // Pass the response to parent callback
      if (onPDFSubmit) {
        onPDFSubmit(response); // Pass the response, not files
      }
    } catch (error) {
      console.error("PDF upload failed:", error);
      toast.error(error.response?.data?.msg || error.message || "Failed to upload PDFs");
    } finally {
      setSubmittingPDFs(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Videos Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-semibold mb-4">
          Add YouTube Videos ({urls.length}/{MAX_URLS})
        </h3>
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              placeholder="Paste YouTube URL here"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleUrlAdd}
              disabled={urls.length >= MAX_URLS}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {urls.map((url, index) => {
              const videoInfo = getYoutubeInfo(url);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <img
                    src={videoInfo?.thumbnail}
                    alt="Video thumbnail"
                    className="w-20 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {videoInfo?.id || "Unknown video"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </div>
                  <button
                    onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleVideoSubmit}
          disabled={submittingVideos || urls.length === 0}
          className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {submittingVideos ? "Submitting Videos..." : "Submit Videos"}
        </button>
      </div>

      {/* PDFs Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-semibold mb-4">
          Upload PDFs ({files.length}/{MAX_FILES})
        </h3>
        <div className="flex-1 space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop PDFs here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Max size: 10MB per file
            </p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-red-500">PDF</span>
                  <span className="truncate text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handlePDFSubmit}
          disabled={submittingPDFs || files.length === 0}
          className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {submittingPDFs ? "Submitting PDFs..." : "Submit PDFs"}
        </button>
      </div>
    </div>
  );
};

export default ResourceUploadSection;
