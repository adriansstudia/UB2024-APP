/* global gapi */

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const FOLDER_ID = process.env.REACT_APP_FOLDER_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const initClient = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        .then(() => {
          resolve(gapi.auth2.getAuthInstance());
        })
        .catch((error) => reject(error));
    });
  });
};

const uploadFileToGoogleDrive = async (csvBlob, fileName) => {
  const FOLDER_ID = [FOLDER_ID]; // Replace with the actual folder ID

  const metadata = {
    name: fileName,
    mimeType: 'text/csv',
    parents: [FOLDER_ID],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', csvBlob);

  try {
    const response = await gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      method: 'POST',
      body: form,
    });

    console.log('File upload response:', response); // Log the response
    if (response.status !== 200) {
      throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error); // Log the error
    throw new Error('Error uploading file to Google Drive: ' + error.message);
  }
};