import React, { createContext, useContext, useState } from 'react';

const GraphContext = createContext(null);

export const GraphProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: []
  });

  const updateGraph = (newData) => {
    setGraphData(prev => ({
      nodes: [...prev.nodes, ...newData.nodes],
      edges: [...prev.edges, ...newData.edges]
    }));
  };

  return (
    <GraphContext.Provider value={{ graphData, updateGraph }}>
      {children}
    </GraphContext.Provider>
  );
};