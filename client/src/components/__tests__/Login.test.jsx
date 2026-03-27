import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Included for standard matcher mappings like .toBeInTheDocument()
import Login from '../Login';

test('renders login button', () => {
  render(<Login />);
  const button = screen.getByText(/login/i);
  expect(button).toBeInTheDocument();
});
