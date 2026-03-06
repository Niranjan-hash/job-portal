import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Profile from './component/Profile'
import Recruiter from './pages/Recruiter';
import Dashboard from './pages/Dashboard';
import Joblist from './component/Joblist';
import Jobposts from './pages/jobposts';
import History from './pages/History';
import Resume from './pages/Resume';
// import Profile from '../../backend/model/profile';
import AppliedJobs from './pages/AppliedJobs';
import JobApplicants from './pages/JobApplicants';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ProjectShowroom from './pages/ProjectShowroom';
import AdminDashboard from './pages/AdminDashboard';
import ChatBot from './component/ChatBot';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = io("http://localhost:5000", {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log("🟢 Global Socket Connected");
      });

      socket.on('notification', (data) => {
        console.log("🔔 Notification received:", data);
        toast.info(data.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => window.location.href = '/notifications' // Quick navigation
        });
      });

      return () => {
        if (socket && socket.connected) {
          socket.disconnect();
        }
      };
    }
  }, []);

  return (
    <>
      <Router>
        <Routes> 
          <Route path='/' element={<Register/>} />
          <Route path='/profile' element={<Profile/>} />
          <Route path='/dashboard' element={<Dashboard/>} />
          <Route path='/recruiter' element={<Recruiter/>} />
          <Route path='/joblist' element={<Joblist/>} />
          <Route path='/jobposts' element={<Jobposts/>} />
          <Route path='/history' element={<History/>} />       
          <Route path='/resume' element={<Resume/>} />
          
          <Route path='/jobs/applied' element={<AppliedJobs/>} />
          <Route path='/job/:jobId/applicants' element={<JobApplicants/>} />
          <Route path='/notifications' element={<Notifications/>} />
          <Route path='/settings' element={<Settings/>} />
          <Route path='/showroom' element={<ProjectShowroom/>} />
          <Route path='/admin' element={<AdminDashboard/>} />
        </Routes>
        <ChatBot />
        <ToastContainer position="top-right" autoClose={5000} />
      </Router>
    </>
  );
}

export default App;
