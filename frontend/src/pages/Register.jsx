import "./Register.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      alert("✅ Login successful");
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
      
      alert("📩 OTP sent to your email");
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

      alert("✅ Account verified successfully");
      setShowVerify(false);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-continer">
      {error && <div className="error">⚠️ {error}</div>}

      {/* ===== LOGIN ===== */}
      <div className={`continer-login ${active?"hide":"show"}`}>
        <div className={`box-login ${active?"hide":"show"}`}>
          <h2>Login</h2>

          <input
            type="text"
            name="userid"
            placeholder="Email"
            value={user.userid}
            onChange={handleLoginChange}
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={user.password}
            onChange={handleLoginChange}
            disabled={loading}
          />
         <label htmlFor="signin page" className="navigate" onClick={()=>{
            setactive(true)
         }}>create-account</label>

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>

      {/* ===== SIGNUP ===== */}
      <div className={`continer-sign ${active? "show":"hide"} ${showVerify?"hide":"show"}` }>
        <div className={`box-sign ${active? "show":"hide"}`}>
          <h2>Sign Up</h2>

          <input
            type="text"
            name="userName"
            placeholder="Name"
            value={newuser.userName}
            onChange={handleSignupChange}
            disabled={loading}
          />

          <input
            type="text"
            name="userid"
            placeholder="Email"
            value={newuser.userid}
            onChange={handleSignupChange}
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={newuser.password}
            onChange={handleSignupChange}
            disabled={loading}
          />
          <label htmlFor="login page" className="navigate" onClick={()=>{
            setactive(false)
          }}>back to login</label>
          <button onClick={handleSignup} disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </div>
      </div>

      {/* ===== OTP VERIFY ===== */}
      {showVerify && (
        <div className={`continer-verif ${showVerify?"show":"hide"}`}>
          <div className="verify">
            <form onSubmit={handleVerify}>
              <label>Verification Code</label>

              <input
                type="text"
                placeholder="Enter OTP"
                value={verification.value}
                onChange={(e) =>
                  setVerification({ value: e.target.value })
                }
                disabled={loading}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
