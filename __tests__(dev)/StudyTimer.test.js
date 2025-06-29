import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import StudyTimer from '../components/StudyTimer';

jest.useFakeTimers();

const renderWithNavigation = (ui) => {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
};

describe('StudyTimer', () => {
  it('renders initial duration, rounds, and timer', () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    expect(getByText(/Study Duration/i)).toBeTruthy();
    expect(getByText(/Rounds:/i)).toBeTruthy();
    expect(getByText(/🕒 25 min/i)).toBeTruthy();
    expect(getByText('25:00')).toBeTruthy();
  });

  it('increases duration by 5 minutes on tap', () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    const durationText = getByText(/🕒 25 min/i);
    fireEvent.press(durationText);
    expect(getByText(/🕒 30 min/i)).toBeTruthy();
  });

  it('decreases duration by 5 minutes on long press', () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    const durationText = getByText(/🕒 25 min/i);
    fireEvent(durationText, 'longPress');
    expect(getByText(/🕒 20 min/i)).toBeTruthy();
  });

  it('starts timer countdown on pressing Start', async () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    const startButton = getByText('Start');

    await act(async () => {
      fireEvent.press(startButton);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(getByText('24:59')).toBeTruthy();
    });
  });

  it('disables Start button while running', async () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    const startButton = getByText('Start');

    await act(async () => {
      fireEvent.press(startButton);
    });

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getByText('Running...').props.accessibilityState.disabled).toBe(true);
    });
  });

  it('shows pick-up count text', () => {
    const { getByText } = renderWithNavigation(<StudyTimer />);
    expect(getByText(/Pick-ups detected:/i)).toBeTruthy();
  });
});
