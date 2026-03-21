# FCM Notification API

##  Overview
Simple Node.js API to send push notifications using Firebase Cloud Messaging.

##  Setup
1. Clone repo
2. Add `serviceAccountKey.json`
3. Run:
   npm install
   node index.js

##  API Endpoint
POST /send

##  Example Request
{
  "token": "your_device_token",
  "title": "Hello",
  "body": "Test message"
}

##  Objective
Demonstrate FCM integration with backend API.
