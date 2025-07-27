import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../screens/LoginScreen/LoginScreen';

// mocks
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
}));

jest.mock('../../firebase', () => ({
  auth: {
    sendPasswordResetEmail: jest.fn(),
  },
}));

jest.mock('../../utils/getApiHost', () => ({
  getApiHost: () => 'https://mock.api',
}));

describe('LoginScreen', () => {
  const mockNavigate = jest.fn();
  const mockReplace = jest.fn();
  const mockAlert = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  function renderScreen() {
    return render(<LoginScreen navigation={{ navigate: mockNavigate, replace: mockReplace }} />);
  }

  it('edge case: alerts if email/username is empty', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Log In'));
    expect(mockAlert).toHaveBeenCalledWith('Invalid Input', expect.any(String));
  });

  it('edge case: alerts if password is weak', () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Email or Username'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'abc');
    fireEvent.press(getByText('Log In'));
    expect(mockAlert).toHaveBeenCalledWith('Weak Password', expect.any(String));
  });

  it('happy path: resolves username to email and logs in', async () => {
    const token = 'test-token';
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: 'user@test.com' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, token }) });

    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Email or Username'), 'myusername');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Valid123!');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockReplace).toHaveBeenCalledWith('Home');
    });
  });

  it('happy path: opens forgot password modal with prefill if email is typed', () => {
  const { getByPlaceholderText, getByText, getAllByDisplayValue } = renderScreen();
  fireEvent.changeText(getByPlaceholderText('Email or Username'), 'user@test.com');
  fireEvent.press(getByText('Forgot password?'));

  const matches = getAllByDisplayValue('user@test.com');
  expect(matches.length).toBeGreaterThan(0);
  });
  

  it('happy path: sends reset email on valid input', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Email or Username'), 'user@test.com');
    fireEvent.press(getByText('Forgot password?'));

    const emailInput = getByPlaceholderText('your@email.com');
    fireEvent.changeText(emailInput, 'user@test.com');
    fireEvent.press(getByText('Send Link'));

    await waitFor(() => {
      expect(require('../../firebase').auth.sendPasswordResetEmail).toHaveBeenCalledWith('user@test.com');
      expect(mockAlert).toHaveBeenCalledWith('Email Sent', expect.any(String));
    });
  });
});
