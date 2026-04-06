import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';

// Mock heavy components or external libraries
vi.mock('./components/MapView', () => ({
  default: () => <div data-testid="mock-map-view">Map View</div>,
}));

vi.mock('./components/LoginScreen', () => ({
  default: () => <div data-testid="login-screen">Login Screen</div>,
}));

test('renders login screen initially', async () => {
  render(<App />);
  
  // Wait for the lazy component to be resolved
  const loginScreen = await screen.findByTestId('login-screen');
  expect(loginScreen).toBeInTheDocument();
});
