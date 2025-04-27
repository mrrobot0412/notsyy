import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { assets } from "../assets/assets";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/dashboard/Menu";
import MainContent from "../components/dashboard/MainContent";
import AddNotebookModal from "../components/dashboard/AddNotebookModal";
import axios from "../utils/axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creatingNotebook, setCreatingNotebook] = useState(false);

  // Fetch notebooks function
  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/folder');
      console.log('Notebooks response:', response.data);
      setNotebooks(response.data.folders || []); // Add fallback empty array
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Check if it's a "no folders found" error
      if (error.response?.status === 404 && error.response?.data?.msg === 'no folders found') {
        setNotebooks([]); // Set empty array instead of showing error
      } else {
        // Only show error toast for actual errors
        toast.error('Failed to load notebooks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleAddNotebook = async (formData) => {
    try {
      setCreatingNotebook(true);
      const response = await axios.post("/folder", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.folder) {
        setNotebooks(prev => [...prev, response.data.folder]);
        toast.success("Notebook created successfully");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating notebook:", error);
      toast.error(error.response?.data?.msg || "Failed to create notebook");
    } finally {
      setCreatingNotebook(false);
    }
  };

  // Delete notebook handler with optimistic updates
  const handleDeleteNotebook = async (notebookId) => {
    try {
      // Store current notebooks state for rollback
      const previousNotebooks = notebooks;

      // Optimistically update UI
      setNotebooks((prevNotebooks) =>
        prevNotebooks.filter((notebook) => notebook._id !== notebookId)
      );

      // Make API call
      await axios.delete(`/folder/${notebookId}`);

      // Show success message
      toast.success("Notebook deleted successfully");
    } catch (error) {
      console.error("Error deleting notebook:", error);

      // Rollback on error
      setNotebooks(previousNotebooks);
      toast.error(error.response?.data?.message || "Failed to delete notebook");

      // Refresh notebooks list
      fetchNotebooks();
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/"); // Changed from /auth/login to /
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
              notebooks={notebooks}
              onAddNotebookClick={() => setIsModalOpen(true)} // This triggers the modal
              loading={loading}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5">
            <div className="backdrop-blur-sm bg-base-white p-7 h-full rounded-xl shadow-sm">
              <MainContent
                notebooks={notebooks}
                loading={loading}
                onDeleteNotebook={handleDeleteNotebook}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Notebook Modal */}
      <AddNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddNotebook}
        loading={creatingNotebook}
      />
    </div>
  );
};

export default Dashboard;
