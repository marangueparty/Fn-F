import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyAJaKvrJi8x-nUM4_2sXUQNMEI87Bv46U8',
  authDomain:        'orbitalfnf.firebaseapp.com',
  projectId:         'orbitalfnf',
  storageBucket:     'orbitalfnf.appspot.com',
  messagingSenderId: '704003550206',
  appId:             '1:704003550206:web:c2709e323745b8926b2eaf',
  measurementId:     'G-2RR4W9HKK1',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();

console.log("Firebase App initialized:", firebase.apps[0].name);