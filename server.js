//require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;
const { google } = require('googleapis');
const admin = require('firebase-admin');
const Busboy = require('busboy');
const fs = require('fs');



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

// API endpoint for image upload
app.post('/api/upload', (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const filePath = `images/${filename}`;  // Define the path in the bucket

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
      res.json({ imageUrl });
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
