import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChatPage } from './components/ChatPage';
import './styles.css';

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/chat"
        element={token ? <ChatPage /> : <Navigate to="/login" />}
      />

      <Route
        path="*"
        element={<Navigate to={token ? '/chat' : '/login'} />}
      />
    </Routes>
  );
}

export default App;