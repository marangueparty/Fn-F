import { fireEvent, render, waitFor } from '@testing-library/react-native';
import 'react-native-gesture-handler/jestSetup';
import App from '../../App';

// mocks for tab screens
jest.mock('../../screens/FocusProgressScreen/FocusProgress', () => () => {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text testID="focus-progress-screen">Focus Progress Screen</Text>;
});

jest.mock('../../screens/AchievementsScreen/Achievements', () => () => {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text testID="achievements-screen">Achievements Screen</Text>;
});

jest.mock('../../screens/LeaderboardScreen/Leaderboard', () => () => {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text testID="leaderboard-screen">Leaderboard Screen</Text>;
});

jest.mock('../../screens/HomeScreen/HomeScreen', () => () => {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text testID="home-screen">Timer Screen</Text>;
});

describe('Integration: Bottom Tab Navigation from Home', () => {
  it('navigates to Timer tab', async () => {
    const { getByTestId } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  it('navigates to Focus tab', async () => {
    const { getByTestId } = render(<App />);
    fireEvent.press(getByTestId('focus-tab'));
    await waitFor(() => {
      expect(getByTestId('focus-progress-screen')).toBeTruthy();
    });
  });

  it('navigates to Achievements tab', async () => {
    const { getByTestId } = render(<App />);
    fireEvent.press(getByTestId('achievement-tab'));
    await waitFor(() => {
      expect(getByTestId('achievements-screen')).toBeTruthy();
    });
  });

  it('navigates to Leaderboard tab', async () => {
    const { getByTestId } = render(<App />);
    fireEvent.press(getByTestId('leaderboard-tab'));
    await waitFor(() => {
      expect(getByTestId('leaderboard-screen')).toBeTruthy();
    });
  });
});
