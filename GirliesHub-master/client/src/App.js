import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import RequestsPage from './pages/RequestsPage';
import FinancePage from './pages/FinancePage';
import GBVSupportPage from './pages/GBVSupportPage';
import SanitaryAidPage from './pages/SanitaryAidPage';
import AIAssistantPage from './pages/AIAssistantPage';
import DonationPage from './pages/DonationPage';
import AboutPage from './pages/AboutPage';

// Material UI Theme with pink primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#E91E63',
    },
    secondary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <NavBar />
            <Box component="main" sx={{ flexGrow: 1, pt: 2 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/gbv-support" element={<GBVSupportPage />} />
                <Route path="/sanitary-aid" element={<SanitaryAidPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/donate" element={<DonationPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
