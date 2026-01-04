import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Searchbar from './component/Searchbar';
import Recruiter from './pages/Recruiter';
import Dashboard from './pages/Dashboard';
import Joblist from './component/Joblist';
import Jobposts from './pages/jobposts';
import History from './pages/History';
function App() {
  return (
    <>
      <Router>
        <Routes> 
          <Route path='/' element={<Register/>} />
          <Route path='/search' element={<Searchbar/>} />
          <Route path='/dashboard' element={<Dashboard/>} />
          <Route path='/recruiter' element={<Recruiter/>} />
          <Route path='/joblist' element={<Joblist/>} />
          <Route path='/jobposts' element={<Jobposts/>} />
          <Route path='/history' element={<History/>} />       
        </Routes>
      </Router>
    </>
  );
}

export default App;
