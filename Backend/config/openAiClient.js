const OpenAI=require('openai')
require('dotenv').config();


const openai = new OpenAI({
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,      
    project: process.env.OPENAI_PROJECT_ID,  
});

module.exports=openai