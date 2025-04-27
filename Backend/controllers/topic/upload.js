const scraper = require('../../services/scrapeTranscript');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, CustomAPIError } = require('../../errors');
const topicModels = require('../../models/topic/topicIndex');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const uploadUrls = async (req, res) => {
    try {
        const urls = req.body.urls;
        const topicId = req.body.topicId;
        const userId = req.user.userId;

        if (!Array.isArray(urls) || urls.length === 0) {
            throw new BadRequestError('URLs must be a non-empty array');
        }

        const aggregatedUrls = [];
        const aggregatedTranscripts = [];
        const results = [];

        for (const url of urls) {
            try {
                const videoId = new URL(url).searchParams.get('v');
                if (!videoId) {
                    throw new BadRequestError('Invalid URL: Video ID not found');
                }

                const transcript = await scraper(url);
                if (!transcript) {
                    throw new NotFoundError('Transcript not available for this video');
                }

                aggregatedUrls.push(url);
                aggregatedTranscripts.push(transcript);
                results.push({ url, status: 'success' });

            } catch (error) {
                console.error(`Error processing ${url}:`, error.message);
                
                results.push({
                    url,
                    status: 'failed',
                    message: error.message,
                    ...(error instanceof CustomAPIError && { errorType: error.constructor.name })
                });
            }
        }

        if (aggregatedUrls.length === 0) {
            throw new NotFoundError('No valid transcripts found in any URLs');
        }

        const newResource = await topicModels.Resource.create({
            type: 'video',
            source: aggregatedUrls,
            content: aggregatedTranscripts,
            topicId,
            userId
        });
        const response=await axios.post('http://127.0.0.1:8000/upload/',{
            type: 'video',
            source: aggregatedUrls,
            content: aggregatedTranscripts,
            topicId,
            userId
        },{
            timeout:1800000
        })
        return res.status(StatusCodes.CREATED).json({
            response: {
                status: response.status,
                data: response.data, // Only send serializable data
                headers: response.headers
            },
            message: `Processed...`,
            data: newResource,
            results
        });

    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({
                msg: error.message,
                ...(error.results && { results: error.results })
            });
        }
        
        console.error('Unexpected error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
    }
};

const uploadPdfs = async (req, res) => {
    try {
        if (!req.files || !req.files['pdf'] || req.files['pdf'].length === 0) {
            throw new BadRequestError('No PDF files uploaded');
        }

        const topicId = req.body.topicId;
        const userId = req.user.userId;
        const pdfFiles = req.files['pdf'];

        // Array for static paths (to be stored in the DB)
        const staticPaths = [];
        // Array for absolute paths to use when reading files from disk
        const absolutePaths = [];
        for (const pdf of pdfFiles) {
            // Static path used for serving (e.g. via /uploads)
            const staticPath = `/uploads/pdf/${pdf.filename}`;
            staticPaths.push(staticPath);

            // Absolute path constructed using path.join
            const absolutePath = path.join(__dirname, '..', '..', 'uploads', 'pdf', pdf.filename);
            absolutePaths.push(absolutePath);
        }

        // Create one FormData and append all PDF files using the "absolutePaths"
        const formData = new FormData();
        for (let i = 0; i < absolutePaths.length; i++) {
            formData.append('pdf', fs.createReadStream(absolutePaths[i]), pdfFiles[i].filename);
        }

        formData.append('topicId', topicId);
        formData.append('userId', userId);
        formData.append('type', 'pdf');

        const apiResponse = await axios.post('http://127.0.0.1:8000/upload/', formData, {
            headers: formData.getHeaders()
        });

        const newResource = await topicModels.Resource.create({
            type: 'pdf',
            source: staticPaths, 
            content: [],
            topicId,
            userId
        });

        return res.status(StatusCodes.CREATED).json({
            message: 'PDFs uploaded and processed successfully',
            newResource,
            apiResponse: {
                status: apiResponse.status,
                data: apiResponse.data,
                headers: apiResponse.headers
            }
            
        });
    } catch (error) {
        console.error('Error in uploadPdfs:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            msg: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    uploadUrls,
    uploadPdfs
};