#  FCM Toolkit — Firebase Cloud Messaging Quick Start

*Technology:* Firebase Cloud Messaging (FCM) HTTP v1 API via Firebase Admin SDK  
*Runtime:* Node.js 18+  
*Difficulty:* Beginner-friendly

---

## Title & Objective

*What technology did I choose?*  
Firebase Cloud Messaging (FCM) — Google's free, cross-platform push notification service.

*Why FCM?*  
- Industry standard used by millions of apps
- Free tier with no per-message cost
- One API targets Android, iOS, and Web
- Long-term support guaranteed by Google

*End goal:*  
Send push notifications from a Node.js server to real devices — single device, multicast, and topic broadcast.

---

## Quick Summary of FCM

| | |
|-|-|
| *What is it?* | A server-to-device relay. Your backend calls FCM → FCM delivers via APNs (iOS) or direct TCP (Android) |
| *Where is it used?* | Chat apps, ride-hailing, e-commerce, news alerts, IoT control |
| *Real-world example* | When a Bolt driver accepts your ride, the server calls FCM and your phone lights up — all within one second |

---

## System Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 LTS or 20 LTS | https://nodejs.org |
| npm | 9+ | Bundled with Node |
| VS Code | Latest | Recommended editor |
| Google account | — | For Firebase Console access |
| Mobile device or emulator | — | To generate a real FCM token |

---

## Project Structure


fcm-toolkit/
├── src/
│   ├── send-notification.js   ← Single device (main example)
│   ├── send-multicast.js      ← Up to 500 devices at once
│   └── manage-topics.js       ← Topic subscribe + broadcast
├── docs/
│   └── FCM_Toolkit_Document.docx  ← Full toolkit document
├── .env.example               ← Environment variable template
├── .gitignore                 ← Excludes secrets from Git
├── package.json
└── README.md


---

## Installation & Setup

### 1. Install Node.js
Download from https://nodejs.org — choose the LTS version.
bash
node --version   # must be v18+ or v20+
npm --version


### 2. Create a Firebase Project
1. Visit https://console.firebase.google.com
2. Click *Add project* → enter a name → click Create
3. Go to *Project Settings* (gear icon) → *Service Accounts*
4. Click *Generate new private key* → confirm
5. Save the downloaded file as *serviceAccountKey.json* in the project root

>  Never commit serviceAccountKey.json to Git. It is in .gitignore.

### 3. Clone and install dependencies
bash
git clone https://github.com/YOUR_USERNAME/fcm-toolkit.git
cd fcm-toolkit
npm install


### 4. Configure your environment
bash
cp .env.example .env

Edit .env and replace the placeholder with a real FCM device registration token.

*How to get a token:*
- *Android:* call FirebaseMessaging.getInstance().getToken()
- *iOS:* call Messaging.messaging().token(completion:)
- *Web:* call getToken(messaging, { vapidKey: '...' })

### 5. Place your service account key

fcm-toolkit/
├── serviceAccountKey.json   ← here (project root)
├── package.json
└── ...


---

## Running the Examples

### Send to a single device
bash
npm run send

*Expected output:*

  Sending FCM push notification...

  Notification sent successfully!
    Message ID : projects/your-project/messages/0:1711234567890...
    Target     : fXyZ1234abcd...


### Multicast (multiple devices)
bash
npm run multicast

*Expected output:*

  Multicast: targeting 1 device(s)...

  Results: 1 sent | ❌ 0 failed
    [0]   Message ID: projects/your-project/messages/0:...


### Topics (subscribe + broadcast)
bash
npm run topics

*Expected output:*

  Subscribing device to topic: "breaking-news"...
     Subscribed: 1 | Errors: 0

  Broadcasting to topic "breaking-news"...
     Message ID: projects/your-project/messages/0:...


---

## Common Errors & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot find module 'serviceAccountKey.json' | File missing from root | Place the file next to package.json |
| messaging/registration-token-not-registered | Token expired or app uninstalled | Get a fresh token from the client |
| messaging/invalid-argument | data values are not strings | Change badge: 1 → badge: '1' |
| Failed to determine project ID | Malformed service account key | Re-download from Firebase Console |
| SyntaxError: Cannot use import statement | ES module syntax in CommonJS | Use require() — this project is CommonJS |

---

## Full Documentation

See docs/FCM_Toolkit_Document.docx for:
- Detailed setup walkthrough with screenshots guidance
- Fully annotated code with explanations
- AI Prompt Journal (4 prompts with evaluations)
- Learning reflections
- All common errors with StackOverflow links
- Official docs, videos, and blog references

---

## Push to GitHub

bash
git init
git add .
git commit -m "feat: FCM toolkit — initial working example"
git remote add origin https://github.com/YOUR_USERNAME/fcm-toolkit.git
git push -u origin main


> serviceAccountKey.json and .env are excluded by .gitignore — they will NOT be pushed.

---

## License
MIT — free to use, modify, and distribute.
