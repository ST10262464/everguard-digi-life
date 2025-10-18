import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Alert, Snackbar } from '@mui/material';
import { connectWallet, getWalletStatus } from '../blockchain/contract';

export default function WalletConnectButton() {
  const [walletStatus, setWalletStatus] = useState({ isConnected: false, address: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check wallet status on component mount
  useEffect(() => {
    const status = getWalletStatus();
    setWalletStatus(status);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await connectWallet();
      setWalletStatus({
        isConnected: true,
        address: result.address
      });
      console.log('✅ Wallet connected:', result);
    } catch (err) {
      console.error('❌ Wallet connection failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <Box>
        {walletStatus.isConnected ? (
          <Button
            variant="outlined"
            color="success"
            disabled
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1,
              borderColor: 'success.main',
              color: 'success.main',
              '&:disabled': {
                borderColor: 'success.main',
                color: 'success.main',
                opacity: 0.8
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {formatAddress(walletStatus.address)}
            </Typography>
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #E91E63 30%, #FF5722 90%)',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #C2185B 30%, #E64A19 90%)',
              }
            }}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Wallet Connection Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
}
