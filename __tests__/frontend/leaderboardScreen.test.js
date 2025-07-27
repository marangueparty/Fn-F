import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor } from '@testing-library/react-native';
import LeaderboardScreen from '../../screens/LeaderboardScreen/Leaderboard';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('happy path: renders leaderboard data correctly', async () => {
    const mockData = {
      success: true,
      leaderboard: [
        { uid: '1', username: 'Alice', minutes: 120, currentLevel: 3 },
        { uid: '2', username: 'Bob',   minutes: 90,  currentLevel: 2 },
        { uid: '3', username: 'Carol', minutes: 60,  currentLevel: 1 },
        { uid: '4', username: 'Dave',  minutes: 30,  currentLevel: 1 },
      ],
    };

    require('expo-secure-store').getItemAsync.mockResolvedValue('mock-token');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { getByText } = render(
      <NavigationContainer>
        <LeaderboardScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('🥇')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('120 min')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();

      expect(getByText('🥈')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();

      expect(getByText('🥉')).toBeTruthy();
      expect(getByText('Carol')).toBeTruthy();

      expect(getByText('4')).toBeTruthy(); // Dave's rank
      expect(getByText('30 min')).toBeTruthy();
    });
  });

  it('happy path: shows error message on fetch failure', async () => {
    require('expo-secure-store').getItemAsync.mockResolvedValue('mock-token');
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(
      <NavigationContainer>
        <LeaderboardScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/Error: Network error/i)).toBeTruthy();
    });
  });
});
