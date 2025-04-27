import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { assets } from '../../assets/assets';

const AddNotebookModal = ({ isOpen, onClose, onAdd, loading }) => {
  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a notebook name");
      return;
    }

    if (name.trim().length > 20) {
      toast.error("Notebook name should be less than 20 characters");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      await onAdd(formData);
      setName('');
      setCoverImage(null);
      setImagePreview('');
      onClose();
    } catch (error) {
      console.error('Error adding notebook:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-primary rounded-xl p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-semibold mb-4 text-white">Create New Notebook</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              Cover Image
            </label>
            <div
              className="relative h-48 group rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border-2 border-dashed border-white/30"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm text-white/80">
                    Click to upload cover image
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Max size: 2MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Notebook Name Input */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Notebook Name <span className="text-sm">(max 20 characters)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter notebook name"
              className="w-full px-3 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/50"
              maxLength={20}
            />
            {name.length > 0 && (
              <p className="text-sm text-white/70 mt-1">
                {20 - name.length} characters remaining
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-white bg-[#362374] hover:bg-[#2b1c5d] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#362374] text-white rounded-lg hover:bg-[#2b1c5d] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNotebookModal;