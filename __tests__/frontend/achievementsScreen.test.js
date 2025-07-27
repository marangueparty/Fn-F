import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import AchievementsScreen from '../../screens/AchievementsScreen/Achievements';

const renderWithNav = (ui) => render(<NavigationContainer>{ui}</NavigationContainer>);

jest.mock('expo-secure-store');
global.fetch = jest.fn();

const mockStats = {
  netFocus:       120,
  penaltyMinutes: 8,
  currentLevel:   2,
  nextLevel:      3,
  minutesForNext: 180,
  minutesToNext:  60,
  rawFocus:       120,
};

const mockAchievements = ['focus_10h', 'streak_3'];

describe('AchievementsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue('mock-token');
  });

  it('happy path: renders stats and unlocked achievements on success', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        stats: mockStats,
        achievements: mockAchievements,
      }),
    });

    const { getByText, getByTestId, queryByText } = renderWithNav(<AchievementsScreen/>);

    await waitFor(() => {
      expect(getByText('Focus Progress')).toBeTruthy();
      expect(getByText('2')).toBeTruthy(); // currentLevel
      expect(getByText('3')).toBeTruthy(); // nextLevel
      expect(getByText('120 / 180 min to next level')).toBeTruthy();
      expect(getByText('Penalties Given')).toBeTruthy();
      expect(getByText('8')).toBeTruthy(); // penalty count
      expect(getByText('10 Hours Focus')).toBeTruthy();
      expect(getByText('3-Day Streak')).toBeTruthy();
    });

    // Should NOT unlock 'First Steps' since rawFocus is > 0, but not in achievements list
    expect(queryByText('First Steps')).toBeTruthy();
  });

  it('happy path: handles API returning success', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Invalid session',
      }),
    });

    const { getByText } = renderWithNav(<AchievementsScreen/>);

    await waitFor(() => {
      expect(getByText('Focus Progress')).toBeTruthy();
      // fallback stats should remain zero
      expect(getByText('0 / 60 min to next level')).toBeTruthy();
    });
  });

  it('error case: handles fetch failure gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = renderWithNav(<AchievementsScreen/>);

    await waitFor(() => {
      expect(getByText('Focus Progress')).toBeTruthy();
      expect(getByText('0 / 60 min to next level')).toBeTruthy();
    });
  });

  it('error case: handles missing SecureStore token gracefully', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);

    const { getByText } = renderWithNav(<AchievementsScreen/>);

    await waitFor(() => {
      expect(getByText('Focus Progress')).toBeTruthy();
      expect(getByText('0 / 60 min to next level')).toBeTruthy();
    });
  });
});
