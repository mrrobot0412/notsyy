import React from 'react';
import GraphViewer from '../graph/GraphViewer';

const TopicGraphViewer = ({ topic, resources = [], notebooks = [], topics = [] }) => {
  // Filter data to only show related nodes
  const filteredData = {
    notebooks: notebooks.filter(notebook => notebook._id === topic.folderId),
    topics: [topic], // Only show current topic
    resources: resources // Show all resources of this topic
  };

  return (
    <div className="h-full w-full">
      <GraphViewer 
        notebooks={filteredData.notebooks}
        topics={filteredData.topics}
        resources={filteredData.resources}
      />
    </div>
  );
};

export default TopicGraphViewer;