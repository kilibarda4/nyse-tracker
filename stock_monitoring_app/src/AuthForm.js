import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // Your firebase.js file
import './AuthForm.css';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);  // Toggle between sign up and sign in
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  

  // Toggle between Sign Up and Sign In
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');  // Clear any previous errors
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        // Sign Up flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        setMessage('Account created! A verification email has been sent to your inbox.');
        setPassword('');
        setIsSignUp(false);
        //setTimeout(()=> navigate('/signin'),5000); //redirects to sign in page after 5 seconds.
      } else {
        // Login flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) 
        {
          setError('Please verify your email to continue signing in.');
          return;
        }
        navigate('/dashboard'); // Redirect to dashboard after successful login or signup
      }
             
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
        {/* NYSE Tracker Title and Subtitle */}
      <div className='auth-header'>
        <h1 className='app-title'>NYSE Tracker</h1>
        <p className='app-subtitle'>Stay Ahead, Trade Smart:<br></br> Real-Time NYSE Prices & Alerts.</p>
      </div>

      <div className="auth-container">
        <h1 className="auth-title">{isSignUp ? 'Create Your Account' : 'Welcome Back!'}</h1>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="auth-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="auth-input"
            required
          />
          <button type="submit" className="auth-button">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="toggle-message">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <span onClick={toggleSignUp} className="toggle-link">
            {isSignUp ? ' Sign In' : ' Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}


export default AuthForm;
