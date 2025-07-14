// api/achievementsService.js

import * as SecureStore from 'expo-secure-store';
import { getApiHost } from '../utils/getApiHost';

const HOST = getApiHost();

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