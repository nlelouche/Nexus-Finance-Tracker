import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import { CalendarIcon } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Register spanish locale
registerLocale('es', es);

interface DatePickerProps {
  value: string; // ISO string 'YYYY-MM-DD' or 'YYYY-MM'
  onChange: (val: string) => void;
  showMonthYearPicker?: boolean;
}

export const DatePicker = ({ value, onChange, showMonthYearPicker = false }: DatePickerProps) => {
  // Parse string to Date object
  let selectedDate = value ? new Date(value + (showMonthYearPicker ? '-01T12:00:00' : 'T12:00:00')) : null;
  if (isNaN(selectedDate?.getTime() ?? 0)) selectedDate = null;

  const handleChange = (date: Date | null) => {
    if (!date) return;
    
    if (showMonthYearPicker) {
      // Return YYYY-MM
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      onChange(`${yr}-${mo}`);
    } else {
      // Return YYYY-MM-DD
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const da = String(date.getDate()).padStart(2, '0');
      onChange(`${yr}-${mo}-${da}`);
    }
  };

  return (
    <div className="relative w-full z-20">
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat={showMonthYearPicker ? 'MM/yyyy' : 'dd/MM/yyyy'}
        locale="es"
        showMonthYearPicker={showMonthYearPicker}
        className="form-control w-full pl-10"
        placeholderText={showMonthYearPicker ? 'MM/AAAA' : 'DD/MM/AAAA'}
      />
      <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />

      {/* Tailwind CSS overrides to make standard react-datepicker dark mode friendly */}
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          background-color: var(--bg-card, #111);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: var(--text-primary, #fff);
          font-family: inherit;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: var(--text-primary, #fff);
          font-weight: 700;
        }
        .react-datepicker__day-name {
          color: var(--text-secondary, #919bb0);
        }
        .react-datepicker__day {
          color: var(--text-secondary, #919bb0);
          border-radius: 6px;
        }
        .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__quarter-text--selected, .react-datepicker__year-text--selected {
          background-color: #3b82f6; /* blue-500 */
          color: white;
          font-weight: bold;
        }
        .react-datepicker__day--keyboard-selected, .react-datepicker__month-text--keyboard-selected, .react-datepicker__quarter-text--keyboard-selected, .react-datepicker__year-text--keyboard-selected {
          background-color: rgba(59, 130, 246, 0.3);
          color: white;
        }
        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
};
