import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import './Auth.css';

const Auth = ({ onLogin, onSignUp }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Send login confirmation (Google users are already verified)
      console.log('Login successful:', user.email);
      
      const userData = {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        provider: 'google',
        picture: user.photoURL
      };
      onLogin(userData);
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      const user = userCredential.user;
      
      // Send email verification on signup
      if (!isLogin && !user.emailVerified) {
        try {
          await sendEmailVerification(user);
          alert('Verification email sent! Please check your inbox.');
        } catch (emailError) {
          console.error('Email verification error:', emailError);
        }
      }
      
      // Send login confirmation email
      if (isLogin) {
        try {
          // Note: Firebase doesn't have built-in login confirmation emails
          // We'll show a success message instead
          console.log('Login successful:', user.email);
        } catch (error) {
          console.error('Login confirmation error:', error);
        }
      }
      
      const userData = {
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email,
        provider: 'email',
        picture: user.photoURL
      };
      
      if (isLogin) {
        onLogin(userData);
      } else {
        onSignUp(userData);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <div className="auth-header">
          <h1 className="auth-title">Arivu AI</h1>
          <p className="auth-subtitle">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>
        
        <div className="auth-content">
          {error && (
            <div className="auth-error">
              <i className="bi bi-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}
          
          <button 
            className="google-auth-btn" 
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <i className="bi bi-google"></i>
            <span>{loading ? 'Loading...' : (isLogin ? 'Sign in with Google' : 'Sign up with Google')}</span>
          </button>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          
          <div className="auth-switch">
            <span>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                className="switch-btn" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

