import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../../screens/SignUp/SignUpScreen';

jest.mock('../../utils/getApiHost', () => ({
  getApiHost: () => 'https://mock.api',
}));

global.fetch = jest.fn();
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const mockNavigation = { replace: jest.fn() };

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('edge case: shows alert if email is empty', () => {
    const { getByText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith('Invalid Input', 'Please enter your email.');
  });

  it('edge case: shows alert if email is invalid', () => {
    const { getByText, getByPlaceholderText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'bademail');
    fireEvent.press(getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith('Invalid Email', 'Please enter a valid email.');
  });

  it('edge case: shows alert if password is weak', () => {
    const { getByText, getByPlaceholderText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.press(getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Weak Password',
      '8+ chars including uppercase, lowercase, digit & symbol.'
    );
  });

  it('edge case: shows alert if username is invalid', () => {
    const { getByText, getByPlaceholderText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Username'), '!!');
    fireEvent.press(getByText('Sign Up'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Username',
      '3-20 chars, letters, numbers, underscores only.'
    );
  });

  it('edge case: alerts if username is taken', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ available: false }),
      ok: true,
    });

    const { getByText, getByPlaceholderText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Username'), 'takenname');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Username Taken', 'Please choose another username.');
    });
  });

  it('happy path: signs up successfully', async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => ({ available: true }), ok: true }) // checkUsername
      .mockResolvedValueOnce({ json: async () => ({ success: true }), ok: true });   // signup

    const { getByText, getByPlaceholderText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Username'), 'validname');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Verify Your Email',
        'A link has been sent to your inbox. Please check before logging in.'
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
