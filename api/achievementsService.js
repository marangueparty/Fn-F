// api/achievementsService.js

import {
    SERVER_HOST_ANDROID,
    SERVER_HOST_DEVICE,
    SERVER_HOST_IOS,
} from '@env';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;

/**
 * GET /achievements/current
 */
export async function loadAchievements() {
  const token = await SecureStore.getItemAsync('userToken');
  const res = await fetch(`${HOST}/achievements/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Load failed ${res.status}`);
  return res.json();
}

/**
 * POST /achievements/current
 */
export async function updateAchievements(payload) {
  const token = await SecureStore.getItemAsync('userToken');
  const res = await fetch(`${HOST}/achievements/current`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Update failed ${res.status}`);
}