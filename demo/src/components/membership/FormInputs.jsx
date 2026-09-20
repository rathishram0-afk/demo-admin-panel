import React, { useRef } from 'react';
import { Lock } from 'lucide-react';

export function FormInput({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  icon: Icon, 
  required = false, 
  readOnly = false, 
  min 
}) {
  const inputRef = useRef(null);

  const openDatePicker = (e) => {
    if (type === 'date' && inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch (err) {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    
    // After selecting a date, immediately remove text selection and blur input
    if (type === 'date') {
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
      setTimeout(() => {
        if (e.target && typeof e.target.blur === 'function') {
          e.target.blur();
        }
        if (inputRef.current) {
          inputRef.current.blur();
        }
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
      }, 50);
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-xs font-cyber font-bold text-gray-300 tracking-wider">
        {label} {required && <span className="text-pink-500">*</span>}
      </label>
      <div 
        onClick={openDatePicker}
        className={`relative rounded-xl overflow-hidden ${type === 'date' ? 'cursor-pointer' : ''}`}
      >
        {Icon && (
          <div 
            onClick={openDatePicker}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-20 ${type === 'date' ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          onClick={openDatePicker}
          placeholder={placeholder}
          readOnly={readOnly}
          min={min}
          className={`w-full py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-10 bg-slate-950/90 border text-sm font-sans rounded-xl focus:outline-none transition-all duration-300 ${
            type === 'date' 
              ? 'color-scheme-dark cursor-pointer caret-transparent select-none selection:bg-transparent selection:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-datetime-edit-fields-wrapper]:bg-transparent [&::-webkit-datetime-edit-text]:text-gray-200 [&::-webkit-datetime-edit-month-field]:bg-transparent [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-month-field:focus]:bg-transparent [&::-webkit-datetime-edit-month-field:focus]:text-white [&::-webkit-datetime-edit-month-field:focus]:outline-none [&::-webkit-datetime-edit-day-field]:bg-transparent [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-day-field:focus]:bg-transparent [&::-webkit-datetime-edit-day-field:focus]:text-white [&::-webkit-datetime-edit-day-field:focus]:outline-none [&::-webkit-datetime-edit-year-field]:bg-transparent [&::-webkit-datetime-edit-year-field]:text-white [&::-webkit-datetime-edit-year-field:focus]:bg-transparent [&::-webkit-datetime-edit-year-field:focus]:text-white [&::-webkit-datetime-edit-year-field:focus]:outline-none' 
              : ''
          } ${
            readOnly
              ? 'border-purple-500/40 text-purple-300 font-cyber font-bold cursor-not-allowed bg-purple-950/30'
              : error
              ? 'border-red-500/80 text-white focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : 'border-white/10 text-white focus:border-pink-500 focus:shadow-[0_0_15px_rgba(255,0,127,0.3)]'
          }`}
          style={type === 'date' ? { colorScheme: 'dark', caretColor: 'transparent' } : undefined}
        />
        {readOnly && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none flex items-center gap-1 z-10">
            <Lock className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 font-sans font-medium mt-1">{error}</p>}
    </div>
  );
}
