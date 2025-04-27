import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopicMenu from "../components/topic/TopicMenu";
import TopicMainContent from "../components/topic/TopicMainContent";
import { assets } from "../assets/assets";
import axios from "../utils/axios";
import { toast } from "react-hot-toast";

const TopicDashboard = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/topic/${topicId}`);
        setTopic(response.data.topic);
        setResources(response.data.resources || []);
      } catch (error) {
        console.error('Error fetching topic data:', error);
        toast.error('Failed to load topic data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicData();
    }
  }, [topicId, navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${assets.dashboardbg})` }}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 backdrop-blur-sm">
            <TopicMenu
              topic={topic}
              resources={resources}
              loading={loading}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5">
            <div className="backdrop-blur-sm bg-base-white p-7 h-full rounded-xl shadow-sm">
              <TopicMainContent
                topic={topic}
                resources={resources}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDashboard;