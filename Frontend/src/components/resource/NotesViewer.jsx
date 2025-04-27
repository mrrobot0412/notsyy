import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createRevisionNotes } from '../../services/notesService';
import ReactMarkdown from 'react-markdown';
import { BsLightbulb, BsBookHalf, BsExclamationTriangle, BsStars } from 'react-icons/bs';
import { MdTipsAndUpdates } from 'react-icons/md';

const NotesViewer = ({ notes, topicId, onNotesUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleCreateNotes = async () => {
    try {
      setLoading(true);
      const response = await createRevisionNotes(topicId);
      if (response.revisionNotes) {
        onNotesUpdate(response.revisionNotes);
        toast.success('Notes created successfully!');
      }
    } catch (error) {
      console.error('Error creating notes:', error);
      toast.error(error.response?.data?.msg || 'Failed to create notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BsBookHalf className="text-primary" />
          Smart Notes
        </h2>
        <button
          onClick={handleCreateNotes}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
        >
          <BsStars />
          {loading ? 'Processing...' : notes ? 'Refresh Notes' : 'Generate Notes'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : notes ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-primary/10 p-6">
                <h1 className="text-3xl font-bold text-gray-800">{notes.title}</h1>
                <p className="mt-4 text-gray-600 leading-relaxed">{notes.introduction}</p>
              </div>
            </div>

            {/* Core Concepts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-primary">
                <BsLightbulb />
                Key Concepts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.core_concepts?.map((concept, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                        {index + 1}
                      </span>
                      <p className="text-gray-700">{concept}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples & Use Cases */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-green-600">
                <BsBookHalf />
                Examples & Applications
              </h2>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{notes.example_or_use_case}</p>
              </div>
            </div>

            {/* Memory Tips */}
            {notes.memory_tips && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-blue-600">
                  <MdTipsAndUpdates />
                  Memory Boosters
                </h2>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{notes.memory_tips}</p>
                </div>
              </div>
            )}

            {/* Common Confusions */}
            {notes.common_confusions?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-amber-600">
                  <BsExclamationTriangle />
                  Watch Out For
                </h2>
                <div className="space-y-3">
                  {notes.common_confusions.map((confusion, index) => (
                    <div key={index} className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-gray-700">{confusion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <BsBookHalf className="text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No revision notes available yet</p>
          <button
            onClick={handleCreateNotes}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2"
          >
            <BsStars />
            Generate Smart Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesViewer;