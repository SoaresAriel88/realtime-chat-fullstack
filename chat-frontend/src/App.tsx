import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChatPage } from './components/ChatPage';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyResetPassword } from './pages/VerifyResetPassword';
import { ResetPassword } from './pages/ResetPassword';
import './styles.css';

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/verify-reset-password"
        element={<VerifyResetPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      
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