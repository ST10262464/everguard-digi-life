import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Box,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Favorite,
  VolunteerActivism,
  School,
  LocalHospital,
  Security,
  AccountBalance,
  CreditCard,
  AccountBalanceWallet,
  Hub,
  Close,
} from '@mui/icons-material';
import { getApiUrl, API_CONFIG } from '../config/api';

const DonationPage = () => {
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCause, setSelectedCause] = useState('general');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [blockdagTxHash, setBlockdagTxHash] = useState('');
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    walletAddress: '',
    cryptoType: 'bitcoin',
    cryptoAddress: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showBlockdagModal, setShowBlockdagModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  
  // New state for real data
  const [donationStats, setDonationStats] = useState(null);
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);

  const predefinedAmounts = [50, 100, 250, 500, 1000, 2500];

  // Fetch donation statistics on component mount
  useEffect(() => {
    fetchDonationStats();
  }, []);

  const fetchDonationStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DONATIONS_STATS));
      if (response.ok) {
        const stats = await response.json();
        setDonationStats(stats);
        
        // Create dynamic causes based on real data
        const dynamicCauses = [
          {
            id: 'general',
            title: 'General Support',
            description: 'Support all our initiatives for women empowerment',
            icon: <VolunteerActivism />,
            raised: stats.donationsByCause.general || 0,
            goal: 100000,
            color: '#E91E63',
          },
          {
            id: 'education',
            title: 'Education & Skills',
            description: 'Fund educational programs and skill development',
            icon: <School />,
            raised: stats.donationsByCause.education || 0,
            goal: 50000,
            color: '#2196F3',
          },
          {
            id: 'health',
            title: 'Health & Sanitary Aid',
            description: 'Provide sanitary products and healthcare support',
            icon: <LocalHospital />,
            raised: stats.donationsByCause.health || 0,
            goal: 30000,
            color: '#4CAF50',
          },
          {
            id: 'gbv',
            title: 'GBV Support',
            description: 'Support survivors of gender-based violence',
            icon: <Security />,
            raised: stats.donationsByCause.gbv || 0,
            goal: 40000,
            color: '#FF9800',
          },
          {
            id: 'finance',
            title: 'Financial Literacy',
            description: 'Teach financial skills and provide microloans',
            icon: <AccountBalance />,
            raised: stats.donationsByCause.finance || 0,
            goal: 35000,
            color: '#9C27B0',
          },
        ];
        
        setCauses(dynamicCauses);
      }
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      // Fallback to static data if API fails
      setCauses([
    {
      id: 'general',
      title: 'General Support',
      description: 'Support all our initiatives for women empowerment',
      icon: <VolunteerActivism />,
      raised: 45000,
      goal: 100000,
      color: '#E91E63',
    },
    {
      id: 'education',
      title: 'Education & Skills',
      description: 'Fund educational programs and skill development',
      icon: <School />,
      raised: 28000,
      goal: 50000,
      color: '#2196F3',
    },
    {
      id: 'health',
      title: 'Health & Sanitary Aid',
      description: 'Provide sanitary products and healthcare support',
      icon: <LocalHospital />,
      raised: 15000,
      goal: 30000,
      color: '#4CAF50',
    },
    {
      id: 'gbv',
      title: 'GBV Support',
      description: 'Support survivors of gender-based violence',
      icon: <Security />,
      raised: 22000,
      goal: 40000,
      color: '#FF9800',
    },
    {
      id: 'finance',
      title: 'Financial Literacy',
      description: 'Teach financial skills and provide microloans',
      icon: <AccountBalance />,
      raised: 18000,
      goal: 35000,
      color: '#9C27B0',
    },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard /> },
    { id: 'crypto', label: 'Cryptocurrency', icon: <AccountBalanceWallet /> },
    { id: 'blockdag', label: 'Blockchain Network', icon: <Hub /> },
  ];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount('');
  };

  const handleInputChange = (field) => (e) => {
    setDonorInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePaymentDetailsChange = (field) => (e) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDonate = async () => {
    const amount = selectedAmount || customAmount;
    if (!amount || amount <= 0) {
      alert('Please select or enter a valid donation amount');
      return;
    }

    setIsProcessing(true);

    try {
      let donationData = {
        amount: parseFloat(amount),
        cause: selectedCause,
        paymentMethod,
        donorInfo
      };

      // If BlockDAG payment method is selected, process through blockchain
      if (paymentMethod === 'blockdag') {
        // Create blockchain transaction using our working system
        const blockchainResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.BLOCKCHAIN.DONATION), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'donation',
            amount: parseFloat(amount),
            cause: selectedCause,
            donor: donorInfo.name || 'Anonymous',
            message: donorInfo.message || `Donation to ${selectedCause}`
          }),
        });

        if (!blockchainResponse.ok) {
          throw new Error('Failed to process blockchain transaction');
        }

        const blockchainResult = await blockchainResponse.json();
        setBlockdagTxHash(blockchainResult.transactionHash);
        donationData.blockchainTxHash = blockchainResult.transactionHash;
      }

      // Send donation to backend API
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DONATIONS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });

      if (!response.ok) {
        throw new Error('Failed to process donation');
      }

      const result = await response.json();
      console.log('Donation processed:', result);

      // Refresh donation stats after successful donation
      await fetchDonationStats();

      setIsProcessing(false);
      setShowSuccess(true);
      
      // Reset form
      setSelectedAmount('');
      setCustomAmount('');
      setDonorInfo({ name: '', email: '', message: '' });
      setPaymentDetails({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '', walletAddress: '', cryptoType: 'bitcoin', cryptoAddress: '' });
      setShowCardModal(false);
      setShowCryptoModal(false);
      setShowBlockdagModal(false);
      
    } catch (error) {
      console.error('Donation error:', error);
      setIsProcessing(false);
      alert('Failed to process donation. Please try again.');
    }
  };

  const selectedCauseData = causes.find(cause => cause.id === selectedCause);
  const donationAmount = selectedAmount || customAmount;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Support Women&apos;s Empowerment
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Your donation helps us provide essential support, education, and resources to women across South Africa
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Causes Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Favorite color="primary" />
                Choose Your Cause
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {causes.map((cause) => (
                  <Grid item xs={12} sm={6} key={cause.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedCause === cause.id ? 2 : 1,
                        borderColor: selectedCause === cause.id ? cause.color : 'divider',
                        '&:hover': { boxShadow: 3 },
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => setSelectedCause(cause.id)}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Avatar sx={{ bgcolor: cause.color, width: 32, height: 32 }}>
                          {cause.icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {cause.title}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {cause.description}
                      </Typography>
                      
                      <Box mb={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">
                            R{cause.raised.toLocaleString()} raised
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            R{cause.goal.toLocaleString()} goal
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(cause.raised / cause.goal) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: cause.color,
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Donation Amount Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Select Donation Amount
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {predefinedAmounts.map((amount) => (
                  <Grid item xs={6} sm={4} md={2} key={amount}>
                    <Button
                      fullWidth
                      variant={selectedAmount === amount ? 'contained' : 'outlined'}
                      onClick={() => handleAmountSelect(amount)}
                      sx={{ py: 1.5 }}
                    >
                      R{amount}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <TextField
                fullWidth
                label="Custom Amount (ZAR)"
                type="number"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter custom amount"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>R</Typography>,
                }}
              />
            </CardContent>
          </Card>

          {/* Payment Method Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Payment Method
              </Typography>
              
              <Grid container spacing={2}>
                {paymentMethods.map((method) => (
                  <Grid item xs={12} sm={6} key={method.id}>
                    <Button
                      fullWidth
                      variant={paymentMethod === method.id ? 'contained' : 'outlined'}
                      onClick={() => {
                        if (method.id === 'card') {
                          setShowCardModal(true);
                        } else if (method.id === 'crypto') {
                          setShowCryptoModal(true);
                        } else if (method.id === 'blockdag') {
                          setShowBlockdagModal(true);
                        }
                      }}
                      startIcon={method.icon}
                      sx={{ py: 1.5, justifyContent: 'flex-start' }}
                    >
                      {method.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

            </CardContent>
          </Card>

          {/* Donor Information */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Donor Information (Optional)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={donorInfo.name}
                    onChange={handleInputChange('name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={donorInfo.email}
                    onChange={handleInputChange('email')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Message (Optional)"
                    value={donorInfo.message}
                    onChange={handleInputChange('message')}
                    placeholder="Leave a message of support..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Donation Summary Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Donation Summary
              </Typography>
              
              {selectedCauseData && (
                <Box mb={2}>
                  <Chip
                    icon={selectedCauseData.icon}
                    label={selectedCauseData.title}
                    sx={{ 
                      bgcolor: selectedCauseData.color,
                      color: 'white',
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {selectedCauseData.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Donation Amount:</Typography>
                <Typography fontWeight="bold">
                  R{donationAmount ? Number(donationAmount).toLocaleString() : '0'}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Processing Fee:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  R0 (We cover it!)
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  R{donationAmount ? Number(donationAmount).toLocaleString() : '0'}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDonate}
                disabled={!donationAmount || donationAmount <= 0 || isProcessing}
                sx={{ py: 1.5, mb: 2 }}
              >
                {isProcessing ? 'Processing...' : `Donate R${donationAmount || '0'}`}
              </Button>

              {isProcessing && (
                <LinearProgress sx={{ mb: 2 }} />
              )}

              {paymentMethod === 'blockdag' && blockdagTxHash && (
                <Box mb={2} p={2} sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.dark" fontWeight="bold" mb={1}>
                     Blockchain Transaction Created
                  </Typography>
                  <Typography variant="body2" color="success.dark" sx={{ wordBreak: 'break-all' }}>
                    TX Hash: {blockdagTxHash}
                  </Typography>
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" textAlign="center">
                {paymentMethod === 'blockdag' 
                   ? 'Your donation will be processed through our secure blockchain network, ensuring transparency and immutability.'
                  : 'Your donation is secure and helps us continue our mission of empowering women across South Africa.'
                }
              </Typography>
            </CardContent>
          </Card>

          {/* Impact Statistics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Impact
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total donations this month:
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  R{donationStats ? donationStats.totalDonations.toLocaleString() : '128,000'}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total donors:
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {donationStats ? donationStats.totalDonors.toLocaleString() : '2,847'}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Every donation, no matter the size, makes a real difference in someone&apos;s life.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Thank you for your generous donation! You&apos;re making a real difference.
        </Alert>
      </Snackbar>

      {/* Credit Card Details Modal */}
      <Dialog 
        open={showCardModal} 
        onClose={() => setShowCardModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Credit Card Details</Typography>
            <IconButton onClick={() => setShowCardModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={paymentDetails.cardholderName}
                onChange={handlePaymentDetailsChange('cardholderName')}
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={paymentDetails.cardNumber}
                onChange={handlePaymentDetailsChange('cardNumber')}
                placeholder="1234 5678 9012 3456"
                inputProps={{ maxLength: 19 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                value={paymentDetails.expiryDate}
                onChange={handlePaymentDetailsChange('expiryDate')}
                placeholder="MM/YY"
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                value={paymentDetails.cvv}
                onChange={handlePaymentDetailsChange('cvv')}
                placeholder="123"
                inputProps={{ maxLength: 4 }}
                type="password"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCardModal(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setPaymentMethod('card');
              setShowCardModal(false);
            }}
            variant="contained"
            disabled={!paymentDetails.cardholderName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv}
          >
            Save Card Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* BlockDAG Details Modal */}
      <Dialog 
        open={showBlockdagModal} 
        onClose={() => setShowBlockdagModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
                         <Typography variant="h6">Blockchain Wallet Details</Typography>
            <IconButton onClick={() => setShowBlockdagModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Your Wallet Address"
              value={paymentDetails.walletAddress}
              onChange={handlePaymentDetailsChange('walletAddress')}
              placeholder="0x1234567890abcdef..."
                             helperText="Enter your blockchain wallet address to process the donation"
              sx={{ mb: 3 }}
            />
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                                 <strong>Note:</strong> Your donation will be processed through our secure blockchain network, 
                ensuring transparency and immutability. The transaction will be recorded on the blockchain 
                 and you&apos;ll receive a transaction hash for verification.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockdagModal(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setPaymentMethod('blockdag');
              setShowBlockdagModal(false);
            }}
            variant="contained"
            disabled={!paymentDetails.walletAddress}
          >
            Save Wallet Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cryptocurrency Details Modal */}
      <Dialog 
        open={showCryptoModal} 
        onClose={() => setShowCryptoModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Cryptocurrency Payment</Typography>
            <IconButton onClick={() => setShowCryptoModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label="Select Cryptocurrency"
              value={paymentDetails.cryptoType}
              onChange={handlePaymentDetailsChange('cryptoType')}
              sx={{ mb: 3 }}
            >
              <MenuItem value="bitcoin">Bitcoin (BTC)</MenuItem>
              <MenuItem value="ethereum">Ethereum (ETH)</MenuItem>
              <MenuItem value="litecoin">Litecoin (LTC)</MenuItem>
              <MenuItem value="dogecoin">Dogecoin (DOGE)</MenuItem>
              <MenuItem value="cardano">Cardano (ADA)</MenuItem>
              <MenuItem value="polkadot">Polkadot (DOT)</MenuItem>
              <MenuItem value="chainlink">Chainlink (LINK)</MenuItem>
              <MenuItem value="stellar">Stellar (XLM)</MenuItem>
              <MenuItem value="ripple">Ripple (XRP)</MenuItem>
              <MenuItem value="polygon">Polygon (MATIC)</MenuItem>
              <MenuItem value="solana">Solana (SOL)</MenuItem>
              <MenuItem value="avalanche">Avalanche (AVAX)</MenuItem>
              <MenuItem value="binancecoin">Binance Coin (BNB)</MenuItem>
              <MenuItem value="usdcoin">USD Coin (USDC)</MenuItem>
              <MenuItem value="tether">Tether (USDT)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Your Wallet Address"
              value={paymentDetails.cryptoAddress}
              onChange={handlePaymentDetailsChange('cryptoAddress')}
              placeholder="Enter your cryptocurrency wallet address"
              helperText="Enter your wallet address for the selected cryptocurrency"
              sx={{ mb: 3 }}
            />
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark">
                <strong>Important:</strong> Please ensure you enter the correct wallet address for the selected cryptocurrency. 
                Transactions are irreversible and funds sent to incorrect addresses cannot be recovered.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCryptoModal(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setPaymentMethod('crypto');
              setShowCryptoModal(false);
            }}
            variant="contained"
            disabled={!paymentDetails.cryptoAddress}
          >
            Save Crypto Details
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DonationPage;
