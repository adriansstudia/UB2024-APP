const express = require('express');
const { uploadFile } = require('./uploadToDrive'); // Adjust the path as needed
const path = require('path');
require('dotenv').config();
const cors = require('cors');
app.use(cors());

const app = express();
app.use(express.json());

app.post('/upload-csv', async (req, res) => {
  console.log('Request received:', req.body); // Log request data
  const { csvContent, fileName } = req.body;
  if (!csvContent || !fileName) {
      return res.status(400).send('Missing CSV content or file name');
  }

  // Save CSV content to a temporary file
  const tempFilePath = path.join(__dirname, fileName);
  fs.writeFileSync(tempFilePath, csvContent);

  try {
      const uploadResponse = await uploadFile(tempFilePath, fileName);
      res.status(200).send(uploadResponse);
  } catch (error) {
      res.status(500).send('Failed to upload file');
  } finally {
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
