import React, { useState } from 'react';
import { format } from 'date-fns';
import { assets } from '../../assets/assets';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axios';

const NotebookCard = ({ notebook, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const createdDate = notebook.createdAt ? 
    format(new Date(notebook.createdAt), 'MMM d, yyyy') : 
    'Recent';

  const getImageUrl = () => {
    if (notebook.path) {
      const imageUrl = `http://localhost:3000${notebook.path}`;
      console.log('Image URL:', imageUrl);
      console.log('Notebook path:', notebook.path);
      return imageUrl;
    }
    console.log('Using default image');
    return assets.defaultNotebook;
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    if (deleting) return;

    try {
      setDeleting(true);
      await onDelete(notebook._id);
      toast.success('Notebook deleted successfully');
    } catch (error) {
      console.error('Error in delete handler:', error);
      toast.error('Failed to delete notebook');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    setShowConfirm(true);
  };

  return (
    <div className="group relative h-[200px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageError ? assets.defaultNotebook : getImageUrl()}
          alt={notebook.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.error('Image load error:', e);
            setImageError(true);
          }}
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 p-4 w-full">
        <h3 className="text-lg font-semibold text-white truncate">{notebook.name}</h3>
        <p className="text-sm text-white/80">
          Created {createdDate}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDeleteClick}
          disabled={deleting}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={e => e.stopPropagation()} // Stop modal clicks from propagating
        >
          <div 
            className="absolute inset-0 bg-black opacity-50" 
            onClick={e => {
              e.stopPropagation();
              !deleting && setShowConfirm(false);
            }}
          />
          <div 
            className="relative bg-white p-6 rounded-lg shadow-xl"
            onClick={e => e.stopPropagation()} // Stop modal content clicks from propagating
          >
            <h3 className="text-lg font-semibold mb-4">Delete Notebook?</h3>
            <p className="mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookCard;