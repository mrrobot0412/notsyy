import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const AddTopic = ({ onAddTopic, loading }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a topic name");
      return;
    }

    try {
      await onAddTopic({ title: title.trim() });
      setTitle('');
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter topic name"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        maxLength={50}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Topic'}
      </button>
    </form>
  );
};

export default AddTopic;