import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphViewer from '../components/graph/GraphViewer';
import { IoArrowBack } from "react-icons/io5";

const GraphViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notebooks, topics, resources } = location.state || {};

  return (
    <div className="h-screen w-screen bg-gray-50">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-primary hover:text-primary-hover"
        >
          <IoArrowBack className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
      
      <div className="h-[calc(100vh-5rem)]">
        <GraphViewer
          notebooks={notebooks}
          topics={topics}
          resources={resources}
          isFullScreen={true}
        />
      </div>
    </div>
  );
};

export default GraphViewPage;