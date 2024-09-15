const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Use environment variables for credentials
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REACT_APP_REFRESH_TOKEN;
const FOLDER_ID = process.env.REACT_APP_FOLDER_ID;

const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });
google.options({ auth: oauth2client });

const drive = google.drive({ version: 'v3' });

async function uploadFile(filepath, fileName) {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'text/csv', // Update MIME type to 'text/csv'
                parents: [FOLDER_ID]
            },
            media: {
                body: fs.createReadStream(filepath)
            },
            fields: 'id,webViewLink,webContentLink,name'
        });
        console.log("Upload response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

module.exports = { uploadFile };
