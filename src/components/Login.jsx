import { useState } from 'react';

export default function Login({ onLogin }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pin, setPin] = useState('');

  const handleButtonClick = () => {
    // Ensure hover state doesn't leak into the expanded panel
    setIsHovered(false);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setPin('');
  };

  const handleLogin = async () => {
    if (pin.trim()) {
      // Call the login function passed from App
      await onLogin(pin.trim());
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {/* Pure CSS Animated Background - Zero Flickering */}
      <div className="iridescent-background" />

      {/* Consistent Frosted Glass Container */}
      <div
        className={`frosted-glass-container ${isExpanded ? 'expanded' : ''}`}
        onClick={!isExpanded ? handleButtonClick : undefined}
        onMouseEnter={!isExpanded ? () => setIsHovered(true) : undefined}
        onMouseLeave={!isExpanded ? () => setIsHovered(false) : undefined}
        onKeyDown={!isExpanded ? (e) => e.key === 'Enter' && handleButtonClick() : undefined}
        tabIndex={!isExpanded ? 0 : -1}
        role={!isExpanded ? 'button' : 'dialog'}
        aria-label={!isExpanded ? (isHovered ? 'Enter PIN to Login' : 'Welcome') : 'PIN Entry Panel'}
      >
        {!isExpanded ? (
          // Button State
          <span>{isHovered ? 'Enter PIN to Login' : 'Welcome'}</span>
        ) : (
          // Panel State
          <>
            <button className="close-button" onClick={handleClose}>
              ×
            </button>

            <div className="panel-content">
              <h2 className="panel-title">Enter Your PIN</h2>

              <input
                type="password"
                className="pin-input"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={6}
              />

              <button className="login-button" onClick={handleLogin}>
                Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
