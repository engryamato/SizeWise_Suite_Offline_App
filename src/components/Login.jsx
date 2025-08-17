import { useState, useRef, useEffect } from 'react';

export default function Login({ onLogin }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'change'
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // Thoughtful button content - one liner that's contextually aware
  const getButtonContent = () => isHovered ? 'Enter PIN to Login' : 'Welcome';

  const handleButtonClick = () => {
    // Ensure hover state doesn't leak into the expanded panel
    setIsHovered(false);
    setIsExpanded(true);
    setMode('login');
    clearMessages();
  };

  const handleClose = () => {
    setIsExpanded(false);
    setPin('');
    setNewPin('');
    setConfirmPin('');
    setCurrentPin('');
    setMode('login');
    clearMessages();
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    if (pin.trim()) {
      setIsLoading(true);
      clearMessages();
      try {
        const result = await onLogin(pin.trim());
        if (!result?.success) {
          setError(result?.error || 'Login failed');
        }
      } catch (err) {
        setError('Login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegisterPin = async () => {
    clearMessages();

    if (!newPin || newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Store the new PIN in localStorage for demo purposes
      const storedPins = JSON.parse(localStorage.getItem('sizewise_pins') || '[]');
      const pinExists = storedPins.some(p => p.pin === newPin);

      if (pinExists) {
        setError('PIN already exists. Please choose a different PIN.');
        return;
      }

      storedPins.push({
        pin: newPin,
        createdAt: new Date().toISOString(),
        isActive: true
      });

      localStorage.setItem('sizewise_pins', JSON.stringify(storedPins));
      setSuccess('PIN registered successfully! You can now use it to login.');

      // Clear form and switch to login mode after success
      setTimeout(() => {
        setNewPin('');
        setConfirmPin('');
        setMode('login');
        clearMessages();
      }, 2000);

    } catch (err) {
      setError('Failed to register PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async () => {
    clearMessages();

    if (!currentPin || currentPin.length < 4) {
      setError('Current PIN must be at least 4 digits');
      return;
    }

    if (!newPin || newPin.length < 4) {
      setError('New PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }

    if (currentPin === newPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    setIsLoading(true);
    try {
      const storedPins = JSON.parse(localStorage.getItem('sizewise_pins') || '[]');
      const currentPinIndex = storedPins.findIndex(p => p.pin === currentPin && p.isActive);

      if (currentPinIndex === -1) {
        setError('Current PIN is invalid');
        return;
      }

      const newPinExists = storedPins.some(p => p.pin === newPin && p.isActive);
      if (newPinExists) {
        setError('New PIN already exists. Please choose a different PIN.');
        return;
      }

      // Deactivate old PIN and add new one
      storedPins[currentPinIndex].isActive = false;
      storedPins.push({
        pin: newPin,
        createdAt: new Date().toISOString(),
        isActive: true
      });

      localStorage.setItem('sizewise_pins', JSON.stringify(storedPins));
      setSuccess('PIN changed successfully! You can now use the new PIN to login.');

      // Clear form and switch to login mode after success
      setTimeout(() => {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setMode('login');
        clearMessages();
      }, 2000);

    } catch (err) {
      setError('Failed to change PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (mode === 'login') {
        handleLogin();
      } else if (mode === 'register') {
        handleRegisterPin();
      } else if (mode === 'change') {
        handleChangePin();
      }
    }
  };

  // Dynamic sizing effect for both button and panel states
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      // Use requestAnimationFrame for smooth updates
      const updateSize = () => {
        // Add transitioning class for perfect center-based scaling
        container.classList.add('transitioning');

        if (isExpanded && contentRef.current) {
          // Panel state - dynamic sizing based on content
          const content = contentRef.current;

          // Temporarily remove constraints to get natural size
          const originalWidth = content.style.width;
          const originalHeight = content.style.height;
          content.style.width = 'auto';
          content.style.height = 'auto';

          // Get the natural size of the content
          const contentRect = content.getBoundingClientRect();
          const contentHeight = Math.max(content.scrollHeight, contentRect.height);
          const contentWidth = Math.max(content.scrollWidth, contentRect.width);

          // Restore original constraints
          content.style.width = originalWidth;
          content.style.height = originalHeight;

          // Calculate final dimensions with padding and constraints
          const minWidth = 320;
          const minHeight = 200;
          const maxWidth = Math.min(window.innerWidth * 0.9, 600);
          const maxHeight = Math.min(window.innerHeight * 0.9, 800);
          const padding = 80; // 40px on each side

          const finalWidth = Math.min(maxWidth, Math.max(minWidth, contentWidth + padding));
          const finalHeight = Math.min(maxHeight, Math.max(minHeight, contentHeight + padding));

          // Apply the dynamic size smoothly while maintaining center positioning
          container.style.width = `${finalWidth}px`;
          container.style.height = `${finalHeight}px`;
          // Ensure transform stays centered during size changes
          container.style.transform = 'translate(-50%, -50%)';

        } else {
          // Button state - dynamic sizing based on thoughtful content
          const buttonText = getButtonContent();

          // Create a temporary element to measure text accurately
          const tempSpan = document.createElement('span');
          tempSpan.style.cssText = `
            visibility: hidden;
            position: absolute;
            top: -9999px;
            left: -9999px;
            font-size: 18px;
            font-weight: 500;
            font-family: ${getComputedStyle(container).fontFamily};
            white-space: nowrap;
            padding: 0;
            margin: 0;
            border: none;
          `;
          tempSpan.textContent = buttonText;
          document.body.appendChild(tempSpan);

          const textWidth = tempSpan.offsetWidth;
          document.body.removeChild(tempSpan);

          // Calculate button dimensions
          const horizontalPadding = 80; // 40px on each side
          const minButtonWidth = 180;
          const maxButtonWidth = 400;
          const buttonHeight = 60;

          const finalWidth = Math.min(maxButtonWidth, Math.max(minButtonWidth, textWidth + horizontalPadding));

          // Apply the dynamic button size while maintaining center positioning
          container.style.width = `${finalWidth}px`;
          container.style.height = `${buttonHeight}px`;
          // Ensure transform stays centered during size changes
          container.style.transform = 'translate(-50%, -50%)';
        }

        // Remove transitioning class after a delay to allow CSS transitions to complete
        setTimeout(() => {
          container.classList.remove('transitioning');
        }, 500); // Match the CSS transition duration
      };

      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(updateSize);
    }
  }, [isExpanded, mode, error, success, isHovered]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (containerRef.current && isExpanded) {
          // Trigger a re-calculation of panel size on window resize
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isExpanded]);

  const getAriaLabel = () => {
    if (!isExpanded) {
      return getButtonContent();
    }
    return 'PIN Entry Panel';
  };

  const renderLoginMode = () => (
    <>
      <h2 className="panel-title">Enter Your PIN</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <input
        type="password"
        className="pin-input"
        placeholder="Enter PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={6}
        disabled={isLoading}
      />

      <button
        className="login-button"
        onClick={handleLogin}
        disabled={isLoading || !pin.trim()}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="pin-management-links">
        <button
          className="link-button"
          onClick={() => { setMode('register'); clearMessages(); }}
          disabled={isLoading}
        >
          Register New PIN
        </button>
        <button
          className="link-button"
          onClick={() => { setMode('change'); clearMessages(); }}
          disabled={isLoading}
        >
          Change Existing PIN
        </button>
      </div>
    </>
  );

  const renderRegisterMode = () => (
    <>
      <h2 className="panel-title">Register New PIN</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <input
        type="password"
        className="pin-input"
        placeholder="Enter New PIN"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={6}
        disabled={isLoading}
      />

      <input
        type="password"
        className="pin-input"
        placeholder="Confirm New PIN"
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={6}
        disabled={isLoading}
      />

      <button
        className="login-button"
        onClick={handleRegisterPin}
        disabled={isLoading || !newPin.trim() || !confirmPin.trim()}
      >
        {isLoading ? 'Registering...' : 'Register PIN'}
      </button>

      <div className="pin-management-links">
        <button
          className="link-button"
          onClick={() => { setMode('login'); clearMessages(); }}
          disabled={isLoading}
        >
          Back to Login
        </button>
      </div>
    </>
  );

  const renderChangeMode = () => (
    <>
      <h2 className="panel-title">Change PIN</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <input
        type="password"
        className="pin-input"
        placeholder="Enter Current PIN"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={6}
        disabled={isLoading}
      />

      <input
        type="password"
        className="pin-input"
        placeholder="Enter New PIN"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={6}
        disabled={isLoading}
      />

      <input
        type="password"
        className="pin-input"
        placeholder="Confirm New PIN"
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={6}
        disabled={isLoading}
      />

      <button
        className="login-button"
        onClick={handleChangePin}
        disabled={isLoading || !currentPin.trim() || !newPin.trim() || !confirmPin.trim()}
      >
        {isLoading ? 'Changing...' : 'Change PIN'}
      </button>

      <div className="pin-management-links">
        <button
          className="link-button"
          onClick={() => { setMode('login'); clearMessages(); }}
          disabled={isLoading}
        >
          Back to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="login-container">
      {/* Pure CSS Animated Background - Zero Flickering */}
      <div className="iridescent-background" />

      {/* Consistent Frosted Glass Container */}
      <div
        ref={containerRef}
        className={`frosted-glass-container ${isExpanded ? 'expanded' : ''} ${mode !== 'login' ? 'pin-management' : ''}`}
        onClick={!isExpanded ? handleButtonClick : undefined}
        onMouseEnter={!isExpanded ? () => setIsHovered(true) : undefined}
        onMouseLeave={!isExpanded ? () => setIsHovered(false) : undefined}
        onKeyDown={!isExpanded ? (e) => e.key === 'Enter' && handleButtonClick() : undefined}
        tabIndex={!isExpanded ? 0 : -1}
        role={!isExpanded ? 'button' : 'dialog'}
        aria-label={getAriaLabel()}
      >
        {!isExpanded ? (
          // Button State - Thoughtful one-liner content
          <span>{getButtonContent()}</span>
        ) : (
          // Panel State
          <>
            <button className="close-button" onClick={handleClose}>
              ×
            </button>

            <div className="panel-content" ref={contentRef}>
              {mode === 'login' && renderLoginMode()}
              {mode === 'register' && renderRegisterMode()}
              {mode === 'change' && renderChangeMode()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
