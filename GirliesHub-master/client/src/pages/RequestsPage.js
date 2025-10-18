import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Fab,
  Grid,
  Chip,
  IconButton,
  Button,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assignment,
  AccountBalance,
  Security,
  LocalHospital,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import RequestFormModal from '../components/RequestFormModal';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl, API_CONFIG } from '../config/api';

const RequestsPage = () => {
  const { t } = useTranslation();
  const { currentUser, getAuthToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for initial state
  const getMockRequests = () => [
    {
      id: 'REQ001',
      name: 'Sarah M.',
      requestType: t('requests.types.finance'),
      description: t('requests.mockData.req001.description'),
      status: 'Processing',
      timestamp: new Date().toISOString(),
      location: t('requests.mockData.req001.location')
    },
    {
      id: 'REQ002',
      name: t('requests.mockData.req002.name'),
      requestType: t('requests.types.gbvSupport'),
      description: t('requests.mockData.req002.description'),
      status: 'Urgent',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      location: t('requests.mockData.req002.location')
    },
    {
      id: 'REQ003',
      name: 'Linda K.',
      requestType: t('requests.types.sanitaryAid'),
      description: t('requests.mockData.req003.description'),
      status: 'Completed',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      location: t('requests.mockData.req003.location')
    }
  ];

  useEffect(() => {
    fetchRequests();
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get fresh ID token if user is authenticated
      let authToken = null;
      if (currentUser) {
        authToken = await getAuthToken();
      }

      // Prepare headers with authentication if available
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Fetch from backend with authentication
      const backendResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.REQUESTS), { headers });
      console.log('Backend requests:', backendResponse.data);
      
      // Extract the requests array from the response
      const backendRequests = backendResponse.data.requests || [];
      
      // Also fetch from blockchain for verification data
      try {
        const blockchainResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.BLOCKCHAIN.REQUESTS));
        console.log('Blockchain requests:', blockchainResponse.data);
        
        const blockchainRequests = blockchainResponse.data.requests || blockchainResponse.data;
        
        // Create a map of blockchain requests by timestamp for matching
        const blockchainMap = new Map();
        blockchainRequests.forEach(req => {
          // Use timestamp as key for matching (closest match)
          const timestamp = new Date(req.timestamp).getTime();
          blockchainMap.set(timestamp, req);
        });
        
        // Enhance backend requests with blockchain data when available
        const enhancedRequests = backendRequests.map(backendReq => {
          const backendTimestamp = new Date(backendReq.timestamp).getTime();
          
          // Find the closest matching blockchain request (within 5 minutes)
          let closestBlockchainReq = null;
          let minTimeDiff = Infinity;
          
          blockchainMap.forEach((blockchainReq, blockchainTimestamp) => {
            const timeDiff = Math.abs(backendTimestamp - blockchainTimestamp);
            if (timeDiff < minTimeDiff && timeDiff < 300000) { // 5 minutes
              minTimeDiff = timeDiff;
              closestBlockchainReq = blockchainReq;
            }
          });
          
          return {
            ...backendReq,
            blockchainVerified: !!closestBlockchainReq,
            requestHash: closestBlockchainReq?.requestHash,
            requester: closestBlockchainReq?.requester
          };
        });
        
        setRequests(enhancedRequests);
      } catch (blockchainError) {
        console.error('Blockchain fetch failed:', blockchainError);
        // Continue with backend data only
        setRequests(backendRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Use mock data if API fails
      setRequests(getMockRequests());
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmitted = (newRequest) => {
    setRequests([newRequest, ...(requests || [])]);
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await axios.delete(getApiUrl(`${API_CONFIG.ENDPOINTS.REQUESTS}/${requestId}`));
        setRequests((requests || []).filter(request => request.id !== requestId));
        console.log('Request deleted successfully:', requestId);
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Failed to delete request. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'urgent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return t('requests.status.completed');
      case 'processing':
        return t('requests.status.processing');
      case 'urgent':
        return t('requests.status.urgent');
      default:
        return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'finance':
        return <AccountBalance />;
      case 'gbv support':
      case 'gbv':
        return <Security />;
      case 'sanitary aid':
      case 'sanitary':
        return <LocalHospital />;
      default:
        return <Assignment />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {t('requests.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('requests.subtitle')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton 
              onClick={fetchRequests} 
              color="primary"
              disabled={loading}
              title="Refresh blockchain data"
            >
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              size="medium"
            >
              Submit Request
            </Button>
          </Box>
        </Box>

        {/* Requests Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {t('requests.loading')}
            </Typography>
          </Box>
        ) : (requests || []).length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Assignment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              {t('requests.noRequests')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('requests.noRequestsDesc')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              size="large"
            >
              {t('requests.submitRequest')}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {(requests || []).map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(request.requestType)}
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                          {request.id}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getTranslatedStatus(request.status)}
                          color={getStatusColor(request.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRequest(request.id)}
                          sx={{ color: 'error.main', '&:hover': { backgroundColor: 'error.light', color: 'white' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Content */}
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{t('requests.type')}:</strong> {request.requestType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{t('requests.name')}:</strong> {request.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{t('requests.location')}:</strong> {request.location}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                      {request.description}
                    </Typography>
                    
                    {/* Blockchain Information */}
                    {request.txHash && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                        <Typography variant="caption" color="success.main" display="block" sx={{ fontWeight: 'bold', mb: 1 }}>
                          ✓ On Blockchain
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          <strong>Block:</strong> {request.blockNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          <strong>Hash:</strong> {request.txHash?.slice(0, 20)}...
                        </Typography>
                        <Link
                          href={`https://primordial.bdagscan.com/tx/${request.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5, 
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <LinkIcon fontSize="small" />
                          <Typography variant="caption">
                            View on BlockDAG Explorer
                          </Typography>
                        </Link>
                      </Box>
                    )}
                    
                    {request.status === 'pending' && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="caption" color="warning.main" display="block" sx={{ fontWeight: 'bold' }}>
                          ⏳ Processing on Blockchain
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                      {t('requests.submitted')}: {new Date(request.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add request"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => setModalOpen(true)}
        >
          <AddIcon />
        </Fab>

        {/* Request Form Modal */}
        <RequestFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onRequestSubmitted={handleRequestSubmitted}
        />
      </Box>
    </Container>
  );
};

export default RequestsPage;