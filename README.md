# Object Detection with Google Cloud Vision API and Firebase Storage

This project enables object detection using the Google Cloud Vision API, where users can upload images to Firebase Storage, and the application will process the images to detect objects.

Additionally, this project integrates **GitHub Actions** with **Google Cloud Run** for continuous integration and deployment (CI/CD) workflows.

## Features

- **Image Upload**: Users can upload images to Firebase Storage.
- **Object Detection**: Detects objects in images using the Google Cloud Vision API.
- **CI/CD Pipeline**: Utilizes GitHub Actions to deploy the application to Google Cloud Run automatically.
- **Serverless Deployment**: The app is deployed to Cloud Run.

## Prerequisites

Before running the project, make sure you have:

- A Google Cloud project with the **Google Vision API** and **Firebase Storage** enabled.
- **Firebase Storage Bucket** set up for image storage.
- **GitHub repository** for managing the project and integrating GitHub Actions.
