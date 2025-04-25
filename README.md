# NAV-EYE
A Public Transport Assistant for the Visually Impaired

This is a [React Native](https://reactnative.dev) app built to help visually impaired individuals navigate public transportation (train, bus, metro) with real-time guidance, voice interaction, and accessibility features.

Bootstrapped using [@react-native-community/cli](https://github.com/react-native-community/cli).

---

## 🚀 Features

- 🔊 Voice Assistant for Navigation & Info  
- 📍 Real-time Geolocation with Nearby Landmarks  
- 🚉 Live Train, Bus, and Metro Navigation Paths  
- 🧽 Station Lists & Route Info  
- 🗣 Accessibility-first UI with TTS & Voice Input  

---

# 💠 Getting Started

> Note: Complete the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.
## 📦 Install Dependencies
```sh
#IN root directory
npm install
```
```sh
cd backend
npm install
```
```sh
cd backend/api-rail
npm install
```
## 🔧 Environment Configuration

> Important: Create the following two .env files

>Use your local IP address instead of localhost. Example: 192.163.8.2 (find it using ipconfig on Windows or ifconfig on Mac/Linux).

#### 📄 Root  `.env` - For your IP Address
```sh
IP_ADDRESS=your_ip_address
```
#### 📄 `backend/.env` – For the GraphQL API Server
```sh
GOOGLE_API_KEY=your_google_api_key
```

## 🔐 Backend Setup
> Important: This app uses two separate servers to function fully.

### 1️⃣ server.js – GraphQL API Server
```sh
cd backend
node server.js
```

- Handles GraphQL queries  
- Integrates with Google Maps API  

### 2️⃣ api-rail/app.js – Express API Server for Train Info
```sh
cd backend/api-rail
node app.js
```
- Provides RESTful endpoints for:
  - Train routes
  - Live status
  - Schedules
  - PNR status  
- Uses scraping and external data sources  

Both servers must be running concurrently for the app to work properly.
## ▶️ Start Metro

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

##  ▶️ Build and Run

### Android
```sh
npx react-native run-android
# OR
yarn android
```

## Modify Your App

Edit App.tsx and enjoy hot reloading with [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

---
## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚫Contributors

• [Dev0Agrawal](https://github.com/Dev0Agrawal)

• [phoenix768](https://github.com/phoenix768)

---
## Acknowledgments

The api-rail module used in this project is based on the [indian-rail-api](https://github.com/AniCrad/indian-rail-api) repository by [AniCrad](https://github.com/AniCrad), which is licensed under the [MIT License](https://github.com/AniCrad/indian-rail-api/blob/main/LICENSE).

We thank the original author for making [indian-rail-api](https://github.com/AniCrad/indian-rail-api) open source and reusable.

---

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
