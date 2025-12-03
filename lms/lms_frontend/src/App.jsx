import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
}

export default App;

