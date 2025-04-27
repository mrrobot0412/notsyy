import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createFlashcards } from '../../services/flashcardService';

const FlashcardViewer = ({ flashcards, topicId, onFlashcardsUpdate }) => {
  const [loading, setLoading] = useState(false);

  // Extract flashcards array properly from the nested structure
  const flashcardsArray = flashcards?.flashcards || [];
  
  const handleCreateFlashcards = async () => {
    try {
      setLoading(true);
      const response = await createFlashcards(topicId);
      console.log('Create flashcards response:', response);
      
      if (response.flashcards) {
        onFlashcardsUpdate(response.flashcards);
        toast.success('Flashcards created successfully!');
      }
    } catch (error) {
      console.error('Error creating flashcards:', error);
      toast.error(error.response?.data?.msg || 'Failed to create flashcards');
    } finally {
      setLoading(false);
    }
  };

  // Group flashcards by color
  const groupedFlashcards = {
    green: flashcardsArray.filter(card => card.color === 'green'),
    yellow: flashcardsArray.filter(card => card.color === 'yellow'),
    red: flashcardsArray.filter(card => card.color === 'red')
  };

  const renderFlashcard = (card, index) => (
    <div
      key={index}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all mb-4"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold line-clamp-2">
          {card.concept}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-4">
          {card.explanation}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 p-4 border-b">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        <button
          onClick={handleCreateFlashcards}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? 'Processing...' : flashcardsArray.length > 0 ? 'Update Flashcards' : 'Create Flashcards'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : flashcardsArray.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full gap-4 p-4">
            {/* Green Section - Regular Priority */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-green-100 rounded-t-lg p-3">
                <h3 className="text-green-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Regular ({groupedFlashcards.green.length})
                </h3>
              </div>
              <div className="flex-1 bg-green-50/50 p-4 rounded-b-lg overflow-y-auto">
                {groupedFlashcards.green.map(renderFlashcard)}
              </div>
            </div>

            {/* Yellow Section - Important */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-yellow-100 rounded-t-lg p-3">
                <h3 className="text-yellow-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Important ({groupedFlashcards.yellow.length})
                </h3>
              </div>
              <div className="flex-1 bg-yellow-50/50 p-4 rounded-b-lg overflow-y-auto">
                {groupedFlashcards.yellow.map(renderFlashcard)}
              </div>
            </div>

            {/* Red Section - Critical */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="bg-red-100 rounded-t-lg p-3">
                <h3 className="text-red-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Critical ({groupedFlashcards.red.length})
                </h3>
              </div>
              <div className="flex-1 bg-red-50/50 p-4 rounded-b-lg overflow-y-auto">
                {groupedFlashcards.red.map(renderFlashcard)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No flashcards available yet</p>
          <button
            onClick={handleCreateFlashcards}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Create Flashcards
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer;