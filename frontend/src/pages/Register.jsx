import "./Register.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiCheckCircle } from 'react-icons/fi';

function Register() {
  // ===== LOGIN STATE =====
  const [user, setUser] = useState({
    userid: "",
    password: "",
  });
  //======SET ACTIVE STATE ======
  const [active,setactive]=useState(true)
  const navigate = useNavigate()
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
      alert("Login successful");
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
      
      alert("OTP sent to your email");
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

      alert("Account verified successfully");
      setShowVerify(false);
      setactive(false); // Go to login after verification
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-continer">
      {error && <div className="error">{error}</div>}

      {/* ===== LOGIN ===== */}
      <div className={`continer-login ${active ? "hide" : "show"}`}>
        <div className="box-login">
          <h2>Welcome Back</h2>
          <p style={{ color: '#cbd5e0', textAlign: 'center', marginTop: '-15px', fontSize: '0.9rem' }}>
            Please enter your details to sign in
          </p>

          <div className="input-wrapper">
            <FiMail className="input-icon" />
            <input
              type="text"
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

          <span className="navigate" onClick={() => setactive(true)}>
            Don't have an account? Create one
          </span>
        </div>
      </div>

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
              placeholder="Full Name"
              value={newuser.userName}
              onChange={handleSignupChange}
              disabled={loading}
            />
          </div>

          <div className="input-wrapper">
            <FiMail className="input-icon" />
            <input
              type="text"
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
