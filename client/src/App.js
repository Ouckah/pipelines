import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// pages
import Home from './pages/Home';

import Login from './pages/Login';
import Signup from './pages/Signup';

import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import EditProfile from './pages/EditProfile';


// import Test from './testing/Test';

// context
import { useAuthContext } from "./hooks/useAuthContext";

// components
import Navbar from './components/Navbar';


function App() {

  const { user } = useAuthContext();

  return (
    <Router>
      <div className='flex flex-col w-screen min-h-screen bg-gray-100'>
        <Navbar />
        <Routes>
          <Route path="/" exact element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          { user && <Route path="/create" element={<CreateProfile />} /> }
          { user && user.profileCreated && <Route path="/edit" element={<EditProfile />} /> }

          { /* User Profiles */ }
          <Route path="/user/:id" element={<Profile />} />

          { /* TESTING */ }
          { /* process.env.REACT_APP_NODE_ENV === "DEV" && <Route path="/test" element={<Test />} /> */ }
        </Routes>
      </div>
    </Router>
  );
}

export default App;