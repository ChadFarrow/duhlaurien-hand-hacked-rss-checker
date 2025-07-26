import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders app without crashing', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  // The app should render without throwing any errors
  expect(screen.getByRole('main')).toBeInTheDocument();
});