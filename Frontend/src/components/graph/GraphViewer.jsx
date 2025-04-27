import React, { useEffect, useRef } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useNavigate } from 'react-router-dom';

const GraphViewer = ({ notebooks = [], topics = [], resources = [] }) => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const rendererRef = useRef(null);
  const navigate = useNavigate();
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef(null);

  const INITIAL_RADIUS = 400; 
  const TOPIC_SPREAD = 200; 
  const RESOURCE_SPREAD = 300; 

  useEffect(() => {
    if (!notebooks.length && !topics.length && !resources.length) return;

    try {
      const graph = new Graph();
      graphRef.current = graph;

      // Spread notebooks further apart
      notebooks.forEach((notebook, index) => {
        if (notebook?._id && notebook?.name) {
          const angle = (index / notebooks.length) * 2 * Math.PI;
          graph.addNode(notebook._id, {
            label: notebook.name,
            size: 8, // Even smaller nodes
            color: '#7D4FFF',
            type: 'notebook',
            x: Math.cos(angle) * INITIAL_RADIUS,
            y: Math.sin(angle) * INITIAL_RADIUS
          });
        }
      });

      // Spread topics further from notebooks
      topics.forEach(topic => {
        if (topic?._id && topic?.title && topic?.folderId) {
          const notebookPos = graph.getNodeAttributes(topic.folderId);
          if (notebookPos) {
            graph.addNode(topic._id, {
              label: topic.title,
              size: 6,
              color: '#78E9D2',
              type: 'topic',
              x: notebookPos.x + (Math.random() - 0.5) * TOPIC_SPREAD,
              y: notebookPos.y + (Math.random() - 0.5) * TOPIC_SPREAD
            });

            // Thinner but longer edges
            graph.addEdge(topic.folderId, topic._id, {
              type: 'topic-notebook',
              size: 1, // Thinner edge
              color: '#7D4FFF80' // Added transparency
            });
          }
        }
      });

      // Add resources with larger spread
      resources.forEach(resource => {
        if (resource?._id && resource?.topicId) {
          const topicPos = graph.getNodeAttributes(resource.topicId);
          if (topicPos) {
            graph.addNode(resource._id, {
              label: resource.title || 'Resource',
              size: 5, // Reduced from 7
              color: '#FF4F5B',
              type: 'resource',
              x: topicPos.x + (Math.random() - 0.5) * RESOURCE_SPREAD,
              y: topicPos.y + (Math.random() - 0.5) * RESOURCE_SPREAD
            });

            graph.addEdge(resource.topicId, resource._id, {
              type: 'resource-topic',
              size: 1.5, // Thinner edge
              color: '#FF4F5B'
            });
          }
        }
      });

      // Update force-directed layout settings
      const sensibleSettings = forceAtlas2.inferSettings(graph);
      forceAtlas2.assign(graph, {
        iterations: 150, // Increased iterations
        settings: {
          ...sensibleSettings,
          gravity: 0.05, // Further reduced gravity
          scalingRatio: 200, // Doubled scaling ratio
          strongGravityMode: false,
          slowDown: 5,
          adjustSizes: true,
          linLogMode: true,
          outboundAttractionDistribution: true,
          barnesHutOptimize: true,
          barnesHutTheta: 0.5,
          preventOverlap: true,
          edgeWeightInfluence: 0.5, // Reduced edge influence
          nodeSpacing: 200 // Increased node spacing
        }
      });

      // Update Sigma renderer settings
      if (containerRef.current) {
        rendererRef.current = new Sigma(graph, containerRef.current, {
          minCameraRatio: 0.05, // Allow more zoom out
          maxCameraRatio: 20,
          renderEdgeLabels: true,
          defaultEdgeType: 'line', // Changed from arrow for cleaner look
          labelDensity: 0.5, // Reduced label density
          labelGridCellSize: 100, // Increased label spacing
          labelRenderedSizeThreshold: 8,
          zIndex: true,
          nodeReducer: (_, data) => {
            if (!data) {
              return {
                size: 5,
                color: '#999',
                label: '',
                type: 'circle',
                dragEnabled: true // Enable dragging for nodes
              };
            }

            const highlighted = data.highlighted || false;
            return {
              ...data,
              size: (data.size || 5) * (highlighted ? 2.5 : 2),
              color: highlighted ? '#000' : (data.color || '#999'),
              label: data.label || '',
              type: 'circle',
              zIndex: highlighted ? 1 : 0,
              dragEnabled: true // Enable dragging for nodes
            };
          },
          edgeReducer: (edge, data) => {
            if (!edge || !data) {
              return {
                size: 1,
                color: '#eee',
                type: 'line'
              };
            }

            try {
              const source = graph.hasNode(edge.source) ? graph.getNodeAttributes(edge.source) : null;
              const target = graph.hasNode(edge.target) ? graph.getNodeAttributes(edge.target) : null;

              const highlighted = (source?.highlighted || target?.highlighted) || false;

              return {
                ...data,
                size: data.size || 1,
                color: highlighted ? '#000' : (data.color || '#eee'),
                type: 'line'
              };
            } catch (error) {
              console.error('Error in edgeReducer:', error);
              return {
                size: 1,
                color: '#eee',
                type: 'line'
              };
            }
          }
        });

        // Add dragging interactions
        rendererRef.current.on('downNode', (e) => {
          isDraggingRef.current = true;
          draggedNodeRef.current = e.node;
          e.preventSigmaDefault();
        });

        rendererRef.current.getMouseCaptor().on('mousemove', (e) => {
          if (!isDraggingRef.current || !draggedNodeRef.current) return;

          const pos = rendererRef.current.viewportToGraph(e);

          graph.setNodeAttribute(draggedNodeRef.current, 'x', pos.x);
          graph.setNodeAttribute(draggedNodeRef.current, 'y', pos.y);

          e.preventSigmaDefault();
          e.original.preventDefault();
          e.original.stopPropagation();
        });

        rendererRef.current.getMouseCaptor().on('mouseup', () => {
          isDraggingRef.current = false;
          draggedNodeRef.current = null;
        });

        rendererRef.current.getMouseCaptor().on('mouseout', () => {
          isDraggingRef.current = false;
          draggedNodeRef.current = null;
        });

        rendererRef.current.on('enterNode', (event) => {
          if (!isDraggingRef.current) {
            const node = event.node;
            if (graph.hasNode(node)) {
              graph.setNodeAttribute(node, 'highlighted', true);
              rendererRef.current.refresh();
            }
          }
        });

        rendererRef.current.on('leaveNode', (event) => {
          const node = event.node;
          if (graph.hasNode(node)) {
            graph.setNodeAttribute(node, 'highlighted', false);
            rendererRef.current.refresh();
          }
        });

        rendererRef.current.on('clickNode', (event) => {
          const node = event.node;
          const attrs = graph.getNodeAttributes(node);

          if (attrs?.type) {
            switch (attrs.type) {
              case 'notebook':
                navigate(`/dashboard/notebook/${node}`);
                break;
              case 'topic':
                navigate(`/dashboard/topic/${node}`);
                break;
              case 'resource':
                navigate(`/dashboard/resource/${node}`);
                break;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error initializing graph:', error);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.kill();
      }
    };
  }, [notebooks, topics, resources, navigate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #7D4FFF20 0%, #7D4FFF10 100%)',
      }}
    >
      {(!notebooks.length && !topics.length && !resources.length) && (
        <div className="flex justify-center items-center h-full text-gray-500">
          No data to visualize
        </div>
      )}
    </div>
  );
};

export default GraphViewer;