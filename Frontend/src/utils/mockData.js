let mockNotebooks = [
  {
    _id: 'notebook_1',
    name: 'DSA',
    coverImage: 'https://source.unsplash.com/featured/800x600/?algorithm',
    createdAt: new Date('2024-04-01').toISOString(),
    topics: []
  },
  {
    _id: 'notebook_2',
    name: 'Web Development',
    coverImage: 'https://source.unsplash.com/featured/800x600/?coding',
    createdAt: new Date('2024-04-02').toISOString(),
    topics: []
  }
];

let notebookCounter = mockNotebooks.length + 1;

const mockDelay = () => new Promise(resolve => setTimeout(resolve, 800));

export const mockFolderService = {
  getAllFolders: async () => {
    await mockDelay();
    return { folders: mockNotebooks };
  },

  createFolder: async (folderData) => {
    await mockDelay();
    const newFolder = {
      _id: `notebook_${notebookCounter++}`,
      name: folderData.name,
      coverImage: `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(folderData.name)}`,
      createdAt: new Date().toISOString(),
      topics: []
    };
    mockNotebooks = [...mockNotebooks, newFolder]; // Use immutable update
    return { folder: newFolder };
  },

  addTopicToFolder: (folderId, topicData) => {
    const folder = mockNotebooks.find(n => n._id === folderId);
    if (folder) {
      const newTopic = {
        _id: Date.now().toString(),
        title: topicData.title,
        createdAt: new Date().toISOString()
      };
      folder.topics.push(newTopic);
      return Promise.resolve({ topic: newTopic });
    }
    return Promise.reject(new Error('Folder not found'));
  }
};