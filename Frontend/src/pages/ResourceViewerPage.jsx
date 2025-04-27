import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoResourceViewer from '../components/topic/VideoResourceViewer';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';

const ResourceViewerPage = () => {
  const { resourceId } = useParams();
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/resource/${resourceId}`);
            console.log('Resource response:', response.data);
            
            if (response.data.resource) {
                const resourceData = response.data.resource;
                console.log('Resource source array:', resourceData.source);
                
                // Ensure source is always an array
                if (!Array.isArray(resourceData.source)) {
                    resourceData.source = [resourceData.source];
                }
                
                setResource(resourceData);
            } else {
                throw new Error('Resource data not found in response');
            }
        } catch (error) {
            console.error('Error fetching resource:', error);
            toast.error(error.response?.data?.msg || 'Failed to load resource');
        } finally {
            setLoading(false);
        }
    };

    if (resourceId) {
        fetchResource();
    }
  }, [resourceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Resource not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-primary/20">
      <div className="h-full">
        <VideoResourceViewer resource={resource} />
      </div>
    </div>
  );
};

export default ResourceViewerPage;