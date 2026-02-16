import { render, screen } from '@testing-library/react';
import App from './App';

test("renders app header", () => {
  render(<App />);
  const title = screen.getByText(/OrganizePro/i);
  expect(title).toBeInTheDocument();
});
