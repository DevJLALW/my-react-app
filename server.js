//require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;
const { google } = require('googleapis');
const admin = require('firebase-admin');
const Busboy = require('busboy');
const fs = require('fs');
const axios = require('axios');


// Local Test only
// const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
// admin.initializeApp({
//    credential: admin.credential.cert(serviceAccount),
//    storageBucket: 'test_img_upload_acs',  // This is your Firebase storage bucket
// });

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: 'test_img_upload_acs',  // Your Firebase Storage bucket name
});


const bucket = admin.storage().bucket();
const db = admin.firestore(); 
const imagesearchRef = db.collection('imagesearch');

// Function to get the Google API OAuth2 token
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,  
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const authClient = await auth.getClient();
  const accessToken = await authClient.getAccessToken();
  return accessToken.token;
}

// API endpoint for image upload
app.post('/api/upload', (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  const { v4: uuidv4 } = require('uuid');

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
  const safeFilename = typeof filename === 'string' ? filename : `upload-${Date.now()}`;
  const uniqueFilename = `${uuidv4()}-${safeFilename}`;
  const filePath = `images/${uniqueFilename}`;

    // Upload the file to Firebase Storage
    const fileUpload = bucket.file(filePath).createWriteStream({
      metadata: {
        contentType: mimetype,
      },
    });

    file.pipe(fileUpload);

    fileUpload.on('finish', async () => {
      console.log('File uploaded to Cloud Storage:', filePath);
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

            // Now, process the image with Google Vision API
            try {

              const [fileBuffer] = await bucket.file(filePath).download();  // ✅ Download from cloud
              const base64Image = fileBuffer.toString('base64');

              const accessToken = await getAccessToken();

              const requestPayload = {
                  requests: [
                      {
                          image: { content: base64Image },
                          features: [{ type: 'OBJECT_LOCALIZATION', maxResults: 10 }],
                      },
                  ],
              };

              const visionAPIUrl = 'https://vision.googleapis.com/v1/images:annotate';
              const response = await axios.post(visionAPIUrl, requestPayload, {
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                  },
              });

              const visionData = response.data.responses[0];
              const objects = visionData.localizedObjectAnnotations.map((obj) => ({
                  name: obj.name,
                  score: obj.score,
                  boundingPoly: obj.boundingPoly.normalizedVertices,
              }));

              // Store image URL and metadata in Firestore
              const docRef = await imagesearchRef.add({
                  imageUrl: imageUrl,
                  visionData: { localizedObjectAnnotations: objects },
                  timestamp: admin.firestore.FieldValue.serverTimestamp(),
              });

              console.log('Data written to Firestore with ID:', docRef.id);
              res.json(objects);
          } catch (err) {
              console.error('Error during image processing:', err);
              res.status(500).json({ error: 'Detection failed', message: err.message });
          }
      });

      fileUpload.on('error', (err) => {
          console.error('Error during file upload:', err);
          res.status(500).json({ error: 'File upload failed', message: err.message });
      });
  });

  req.pipe(busboy);  // Pipe the incoming request to Busboy
});


// Serve React build folder
app.use(express.static(path.join(__dirname, 'build')));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
