import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import BreakScreen from '../../screens/HomeScreen/BreakScreen/BreakScreen';

// mock navigation and route
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
  };
});

const mockUseRoute = require('@react-navigation/native').useRoute;
const mockUseNavigation = require('@react-navigation/native').useNavigation;

describe('BreakScreen', () => {
  let goBackMock, navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    goBackMock = jest.fn();
    navigateMock = jest.fn();

    mockUseNavigation.mockReturnValue({
      goBack: goBackMock,
      navigate: navigateMock,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('happy path: renders correctly with initial time', () => {
    mockUseRoute.mockReturnValue({
      params: { breakDuration: 0.1 }, // 6 seconds
    });

    const { getByText } = render(
      <NavigationContainer>
        <BreakScreen />
      </NavigationContainer>
    );

    expect(getByText('Take a break!')).toBeTruthy();
    expect(getByText('00:06')).toBeTruthy();
    expect(getByText('You’ll be taken to Focus when time’s up.')).toBeTruthy();
  });

  it('happy path: calls onBreakEnd and navigates back when timer hits zero', async () => {
    const onBreakEndMock = jest.fn();

    mockUseRoute.mockReturnValue({
      params: {
        breakDuration: 0.05, // 3 seconds
        onBreakEnd: onBreakEndMock,
      },
    });

    render(
      <NavigationContainer>
        <BreakScreen />
      </NavigationContainer>
    );

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(onBreakEndMock).toHaveBeenCalledTimes(1);
      expect(goBackMock).toHaveBeenCalledTimes(1);
    });
  });

  it('edge case: navigates to Home > Focus with params if no onBreakEnd', async () => {
    const fakeSession = { id: 1 };

    mockUseRoute.mockReturnValue({
      params: {
        breakDuration: 0.05,
        sessionData: fakeSession,
      },
    });

    render(
      <NavigationContainer>
        <BreakScreen />
      </NavigationContainer>
    );

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('Home', {
        screen: 'Focus',
        params: { breakJustEnded: true, sessionData: fakeSession },
      });
    });
  });
});
