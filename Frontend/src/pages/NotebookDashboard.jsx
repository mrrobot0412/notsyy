import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/notebook/NotebookMenu";
import MainContent from "../components/notebook/NotebookMainContent";
import { assets } from "../assets/assets";
import axios from "../utils/axios";
import { toast } from "react-hot-toast";
import AddTopicModal from "../components/notebook/AddTopicModal";

const NotebookDashboard = () => {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchNotebookData = async () => {
      try {
        setLoading(true);
        // Fetch notebook and topics
        const response = await axios.get(`/folder/${notebookId}`);
        setNotebook(response.data.folder);

        // Get topics
        const topicsData = response.data.topics || [];
        setTopics(topicsData);

        // Fetch resources for all topics
        const resourcePromises = topicsData.map(topic =>
          axios.get(`/topic/${topic._id}`)
        );

        const resourceResponses = await Promise.all(resourcePromises);
        const allResources = resourceResponses.reduce((acc, response) => {
          return [...acc, ...(response.data.resources || [])];
        }, []);

        setResources(allResources);
      } catch (error) {
        console.error('Error fetching notebook data:', error);
        toast.error('Failed to load notebook data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (notebookId) {
      fetchNotebookData();
    }
  }, [notebookId, navigate]);

  const handleAddTopic = async (formData) => {
    try {
      setAddingTopic(true);
      
      // Create proper FormData object
      const topicFormData = new FormData();
      topicFormData.append('topic', formData.get('title')); // Topic name
      topicFormData.append('folderId', notebookId); // Parent notebook ID

      // Only append coverImage if it exists
      const coverImage = formData.get('coverImage');
      if (coverImage) {
        topicFormData.append('coverImage', coverImage);
      }

      // Log FormData contents for debugging
      for (let pair of topicFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post("/topic", topicFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.newTopic) {
        setTopics(prev => [...prev, response.data.newTopic]);
        toast.success("Topic created successfully");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating topic:", error.response?.data || error);
      toast.error(error.response?.data?.msg || "Failed to create topic");
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`/topic/${topicId}`);
      setTopics(prev => prev.filter(topic => topic._id !== topicId));
      toast.success("Topic deleted successfully");
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${assets.dashboardbg})` }}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 backdrop-blur-sm">
            <Menu
              notebook={notebook}
              topics={topics}
              loading={loading}
              onAddTopicClick={() => setIsModalOpen(true)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5">
            <div className="backdrop-blur-sm bg-base-white p-7 h-full rounded-xl shadow-sm">
              <MainContent
                notebook={notebook}
                topics={topics}
                resources={resources}
                loading={loading}
                onAddTopic={() => setIsModalOpen(true)}
                onDeleteTopic={handleDeleteTopic}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTopic}
        loading={addingTopic}
      />
    </div>
  );
};

export default NotebookDashboard;