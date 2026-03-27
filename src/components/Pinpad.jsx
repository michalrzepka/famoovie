import { useState } from "react";

export default function Pinpad({ onSubmit, label = "Enter PIN", disabled = false }) {
  const [pin, setPin] = useState("");

  function handleDigit(digit) {
    if (disabled) return;
    setPin((p) => p + digit);
  }

  function handleClear() {
    setPin("");
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  function handleOk() {
    if (pin && !disabled) {
      onSubmit(pin);
    }
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="pinpad">
      <div className="pinpad-label">{label}</div>
      <div className="pinpad-display">
        <span className="pinpad-dots">
          {pin.split("").map((_, i) => (
            <span key={i} className="pinpad-dot" />
          ))}
        </span>
        {pin.length > 0 && (
          <button
            type="button"
            className="pinpad-backspace"
            onClick={handleBackspace}
            disabled={disabled}
          >
            ←
          </button>
        )}
      </div>
      <div className="pinpad-grid">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            className="pinpad-digit"
            onClick={() => handleDigit(String(d))}
            disabled={disabled}
          >
            {d}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="pinpad-digit pinpad-zero"
        onClick={() => handleDigit("0")}
        disabled={disabled}
      >
        0
      </button>
      <div className="pinpad-actions">
        <button
          type="button"
          className="pinpad-clear"
          onClick={handleClear}
          disabled={disabled || !pin}
        >
          Clear
        </button>
        <button
          type="button"
          className="pinpad-ok"
          onClick={handleOk}
          disabled={disabled || !pin}
        >
          OK
        </button>
      </div>
    </div>
  );
}
