import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { fireEvent, render } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen/HomeScreen';

// mock child tabs
jest.mock('../../screens/HomeScreen/Tabs/HomeTab',        () => () => <></>);
jest.mock('../../screens/HomeScreen/Tabs/FocusTab',       () => () => <></>);
jest.mock('../../screens/HomeScreen/Tabs/AchievementsTab',() => () => <></>);
jest.mock('../../screens/HomeScreen/Tabs/LeaderboardTab', () => () => <></>);

// mock useNavigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

describe('HomeScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigation.mockReturnValue({ navigate: mockNavigate });
    jest.clearAllMocks();
  });

  it('happy path: renders profile button and all 4 tabs', () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    expect(getByTestId('profile-button')).toBeTruthy();
    expect(getByText('Timer')).toBeTruthy();
    expect(getByText('Focus')).toBeTruthy();
    expect(getByText('Achievements')).toBeTruthy();
    expect(getByText('Leaderboard')).toBeTruthy();
  });

  it('happy path: navigates to Profile when profile button is pressed', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    const button = getByTestId('profile-button');
    fireEvent.press(button);
    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });
});
