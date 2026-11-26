import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('DivertIQ App Integration', () => {
  it('renders Overview and navigates smoothly across all 5 modules with interactive state', () => {
    render(<App />);

    // Overview renders headline & municipality selector
    expect(screen.getByText(/Stop MRF Bale Rejections/i)).toBeInTheDocument();

    // Switch municipality to Beijing 4-Bin
    const citySelect = screen.getByLabelText(/Select Municipality Rules/i);
    fireEvent.change(citySelect, { target: { value: 'beijing' } });
    expect(screen.getByText(/Active Municipal Profile: Beijing \(4-Bin\)/i)).toBeInTheDocument();

    // Navigate to Vision Triage & Rules tab and test 1-click specimen switching
    fireEvent.click(screen.getByRole('button', { name: /Vision Triage & Rules/i }));
    expect(screen.getByText(/On-Device Pixel Material/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Aluminum Soda Can/i }));
    expect(screen.getAllByText(/Aluminum Beverage Can/i).length).toBeGreaterThanOrEqual(1);

    // Log current vision item to Audit Ledger
    fireEvent.click(screen.getByRole('button', { name: /Log to Audit Ledger/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Logged/i);

    // Navigate to Food Rescue VRP tab and switch preset
    fireEvent.click(screen.getByRole('button', { name: /Food Rescue VRP/i }));
    expect(screen.getByText(/Live Perishability-Aware Food Rescue Map/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /High-Perishability Hot-Meal Rush/i }));
    expect(screen.getByText(/Dispatch Manifest/i)).toBeInTheDocument();

    // Navigate to EPA WARM v16 Simulator tab
    fireEvent.click(screen.getByRole('button', { name: /EPA WARM v16 Simulator/i }));
    expect(screen.getByText(/MRF Contamination Tipping-Point Economics/i)).toBeInTheDocument();
    expect(screen.getByText(/500 Seeded Trials/i)).toBeInTheDocument();

    // Navigate to Audit & Export tab and add a manual record
    fireEvent.click(screen.getByRole('button', { name: /Audit & Export/i }));
    expect(screen.getByText(/Field Measurement & Verification Protocol/i)).toBeInTheDocument();
    const input = screen.getByLabelText(/Manual audit item name/i);
    fireEvent.change(input, { target: { value: 'Dorm Wing B Bin Check' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Record/i }));
    expect(screen.getAllByText(/Dorm Wing B Bin Check/i).length).toBeGreaterThanOrEqual(1);
  });
});
