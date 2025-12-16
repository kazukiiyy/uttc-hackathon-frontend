export const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'https://hackathon-backend-982651832089.europe-west1.run.app',
  paymentApiBaseUrl: process.env.REACT_APP_PAYMENT_API_BASE_URL || 'https://uttc-hack-back-onchain-982651832089.europe-west1.run.app',
  firebase: {
    apiKey: process.env.REACT_APP_APIKEY,
    authDomain: process.env.REACT_APP_AUTHDOMAIN,
    projectId: process.env.REACT_APP_PROJECTID,
    storageBucket: process.env.REACT_APP_STORAGEBACKET,
    messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
    appId: process.env.REACT_APP_APPID,
    measurementId: process.env.REACT_APP_MEASUREMENTID,
  },
} as const;
