import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import FocusProgress from '../../screens/FocusProgressScreen/FocusProgress';

jest.mock('expo-secure-store');
global.fetch = jest.fn();

const renderWithNav = (ui) => (
  render(<NavigationContainer>{ui}</NavigationContainer>)
);

const mockSessions = [
  {
    studyDuration: 60,
    breakDuration: 15,
    startedAt: { _seconds: Math.floor(Date.now() / 1000) }, // today
  },
];

const mockGoals = {
  success: true,
  goals: { dailyHours: 3 },
};

describe('FocusProgress Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue('mock-token');
  });

  it('happy path: renders goal and chart data', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSessions }) // /sessions
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoals });    // /settings/goals

    const { getByText } = renderWithNav(<FocusProgress />);

    await waitFor(() => {
      expect(getByText('Daily Study Goal')).toBeTruthy();
      expect(getByText('3h')).toBeTruthy(); // pulled goal
      expect(getByText('Total Focus')).toBeTruthy();
      expect(getByText('60 min')).toBeTruthy(); // studyDuration from session
    });
  });

  it('edge case: shows alert if /sessions fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithNav(<FocusProgress />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not load sessions');
      expect(getByText('Daily Study Goal')).toBeTruthy(); // still renders UI
    });

    alertSpy.mockRestore();
  });

  it('error case: shows alert if goal update is invalid (e.g. 999)', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSessions }) // /sessions
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoals });   // /settings/goals

    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = renderWithNav(<FocusProgress />);

    await waitFor(() => expect(getByText('Edit')).toBeTruthy());

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('e.g. 2'), '999');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid Goal', 'Enter 0–24');
    });

    alertSpy.mockRestore();
  });

  it('happy path: submits a valid new goal and closes modal', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSessions }) // /sessions
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoals })    // /settings/goals
      .mockResolvedValueOnce({ ok: true });                                // POST /settings/goals

    const { getByText, getByPlaceholderText, queryByText } = renderWithNav(<FocusProgress />);

    await waitFor(() => expect(getByText('Edit')).toBeTruthy());

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByPlaceholderText('e.g. 2'), '2.5');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(queryByText('Set Daily Study Goal')).toBeNull(); // modal closed
    });
  });
});
