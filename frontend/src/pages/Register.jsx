import "./Register.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiCheckCircle } from 'react-icons/fi';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { toast } from 'react-toastify';

function Register() {
  // ===== LOGIN STATE =====
  const [user, setUser] = useState({
    userid: "",
    password: "",
  });
  const [active,setactive]=useState(true)
  const navigate = useNavigate()

  useGSAP(() => {
    gsap.fromTo('.box-login, .box-sign', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  useGSAP(() => {
    const target = active ? '.continer-sign' : '.continer-login';
    gsap.fromTo(target, 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, [active]);
  // ===== SIGNUP STATE =====
  const [newuser, setnewuser] = useState({
    userName: "",
    userid: "",
    password: "",
  });

  // ===== OTP STATE =====
  const [verification, setVerification] = useState({
    value: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ===== HANDLERS =====
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setnewuser((prev) => ({ ...prev, [name]: value }));
  };

  // ===== LOGIN =====
  const handleLogin = async () => {
    if (!user.userid || !user.password) {
      setError("Please fill in all login fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        "http://localhost:5000/user/login",
        user
      );

      localStorage.setItem("token", res.data.token);
      toast.success("Login successful");
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== SIGNUP =====
  const handleSignup = async () => {
    if (!newuser.userName || !newuser.userid || !newuser.password) {
      setError("Please fill in all signup fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
       console.log(newuser)
      await axios.post("http://localhost:5000/user/signup", newuser).then(()=>{
        setShowVerify(true)
      })
      
      toast.info("OTP sent to your email");
      setShowVerify(true);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== VERIFY OTP =====
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!verification.value) {
      setError("Please enter OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post("http://localhost:5000/user/verify-otp", {
        otp: verification.value,
        userid: newuser.userid,
      });

      toast.success("Account verified successfully");
      setShowVerify(false);
      setactive(false); // Go to login after verification
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ===== FORGOT PASSWORD =====
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post("http://localhost:5000/user/forgot-password", { userid: forgotEmail });
      toast.info("Reset OTP sent to your email");
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset OTP");
    } finally {
      setLoading(false);
    }
  };

  // ===== RESET PASSWORD =====
  const handleResetPassword = async () => {
    if (!forgotOtp || !newPassword) {
      setError("Please fill in OTP and new password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post("http://localhost:5000/user/reset-password", {
        userid: forgotEmail,
        otp: forgotOtp,
        newPassword: newPassword
      });
      toast.success("Password reset successful. Please login.");
      setShowForgot(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
      setactive(false); // Ensure login view is active
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-continer">
      {error && <div className="error">{error}</div>}

      {/* ===== LOGIN ===== */}
      <div className={`continer-login ${active || showForgot ? "hide" : "show"}`}>
        <div className="box-login">
          <h2>Welcome Back</h2>
          <p style={{ color: '#cbd5e0', textAlign: 'center', marginTop: '-15px', fontSize: '0.9rem' }}>
            Please enter your details to sign in
          </p>

          <div className="input-wrapper">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="userid"
              placeholder="Email Address"
              value={user.userid}
              onChange={handleLoginChange}
              disabled={loading}
            />
          </div>

          <div className="input-wrapper">
            <FiLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={user.password}
              onChange={handleLoginChange}
              disabled={loading}
            />
          </div>

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '10px' }}>
            <span className="navigate" onClick={() => setactive(true)}>
              Create new one
            </span>
            <span className="navigate" onClick={() => setShowForgot(true)} style={{ color: 'var(--primary)' }}>
              Forgot Password?
            </span>
          </div>
        </div>
      </div>

      {/* ===== FORGOT PASSWORD ===== */}
      {showForgot && (
        <div className="continer-verif show">
          <div className="verify">
            <div style={{ textAlign: 'center' }}>
              <FiLock style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '15px' }} />
              <h2>Reset Password</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '5px' }}>
                {forgotStep === 1 ? "Enter your email to receive an OTP" : "Enter OTP and your new password"}
              </p>
            </div>

            {forgotStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="text"
                    placeholder="Email Address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button onClick={handleForgotPassword} disabled={loading} style={{ background: 'var(--primary)', borderRadius: '12px' }}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: '800' }}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button onClick={handleResetPassword} disabled={loading} style={{ background: 'var(--primary)', borderRadius: '12px' }}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
            
            <span className="navigate" onClick={() => { setShowForgot(false); setForgotStep(1); }} style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '10px', display: 'block', textAlign: 'center' }}>
              Back to Sign In
            </span>
          </div>
        </div>
      )}

      {/* ===== SIGNUP ===== */}
      <div className={`continer-sign ${active && !showVerify ? "show" : "hide"}`}>
        <div className="box-sign">
          <h2>Create Account</h2>
          <p style={{ color: '#cbd5e0', textAlign: 'center', marginTop: '-15px', fontSize: '0.9rem' }}>
            Join our professional network today
          </p>

          <div className="input-wrapper">
            <FiUser className="input-icon" />
            <input
              type="text"
              name="userName"
              placeholder="User Name"
              value={newuser.userName}
              onChange={handleSignupChange}
              disabled={loading}
            />
          </div>

          <div className="input-wrapper">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="userid"
              placeholder="Email Address"
              value={newuser.userid}
              onChange={handleSignupChange}
              disabled={loading}
            />
          </div>

          <div className="input-wrapper">
            <FiLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newuser.password}
              onChange={handleSignupChange}
              disabled={loading}
            />
          </div>

          <button onClick={handleSignup} disabled={loading}>
            {loading ? "Creating account..." : "Get Started"}
          </button>

          <span className="navigate" onClick={() => setactive(false)}>
            Already have an account? Sign In
          </span>
        </div>
      </div>

      {/* ===== OTP VERIFY ===== */}
      {showVerify && (
        <div className="continer-verif show">
          <div className="verify">
            <div style={{ textAlign: 'center' }}>
              <FiCheckCircle style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '15px' }} />
              <h2>Verify Email</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '5px' }}>
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: '800' }}
                  value={verification.value}
                  onChange={(e) =>
                    setVerification({ value: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} style={{ background: 'var(--primary)', borderRadius: '12px' }}>
                {loading ? "Verifying..." : "Verify Account"}
              </button>
            </form>
            
            <span className="navigate" onClick={() => setShowVerify(false)} style={{ color: 'var(--primary)', fontWeight: '600' }}>
              Back to Sign Up
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
