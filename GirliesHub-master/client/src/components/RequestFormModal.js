import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';

import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl, API_CONFIG } from '../config/api';

const RequestFormModal = ({ open, onClose, onRequestSubmitted }) => {
  const { currentUser, getAuthToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    requestType: '',
    description: '',
    date: new Date(),
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const requestTypes = [
    'Finance',
    'GBV Support',
    'Sanitary Aid',
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      date: newDate,
    });
  };

  const handleSubmit = async () => {
    if (!formData.requestType || !formData.description || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get fresh ID token if user is authenticated
      let authToken = null;
      if (currentUser) {
        authToken = await getAuthToken();
      }

      // Prepare request data
      const requestData = {
        name: formData.name || (currentUser ? currentUser.displayName || 'Anonymous' : 'Anonymous'),
        requestType: formData.requestType,
        description: formData.description,
        date: formData.date.toISOString(),
        location: formData.location,
      };

      // Prepare headers with authentication if available
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Submit to backend with authentication
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.REQUESTS), requestData, { headers });

      console.log('✅ Request submitted to backend:', response.data);

      // The request is now queued for blockchain processing
      // The queue worker will handle the blockchain submission
      setSubmittedRequest(response.data);

      setShowConfirmation(true);
      
      // Reset form
      setFormData({
        name: '',
        requestType: '',
        description: '',
        date: new Date(),
        location: '',
      });

      // Notify parent component
      if (onRequestSubmitted) {
        onRequestSubmitted(response.data);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      requestType: '',
      description: '',
      date: new Date(),
      location: '',
    });
    onClose();
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    handleClose();
  };

  return (
    <>
        <Dialog 
          open={open} 
          onClose={handleClose} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Submit Support Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill out the form below to submit your request for support
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Name (Optional)"
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                placeholder="Enter your name or leave blank for anonymous"
              />

              <FormControl fullWidth required>
                <InputLabel>Request Type</InputLabel>
                <Select
                  value={formData.requestType}
                  onChange={handleInputChange('requestType')}
                  label="Request Type"
                >
                  {requestTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                fullWidth
                required
                multiline
                rows={4}
                placeholder="Please describe your request in detail..."
              />

              <TextField
                label="Preferred Date"
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                fullWidth
                required
                placeholder="City, Province or specific address"
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              sx={{ ml: 1 }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>

      {/* Confirmation Snackbar */}
      <Snackbar
        open={showConfirmation}
        autoHideDuration={6000}
        onClose={handleConfirmationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleConfirmationClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Request Submitted Successfully!
          </Typography>
          {submittedRequest && (
            <Box>
              <Typography variant="body2">
                <strong>Request ID:</strong> {submittedRequest.id}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {submittedRequest.status}
              </Typography>
              <Typography variant="body2">
                <strong>Submitted:</strong> {new Date(submittedRequest.timestamp).toLocaleString()}
              </Typography>
              
              {submittedRequest.blockchain && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    🌐 Blockchain Transaction:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>TX Hash:</strong> {submittedRequest.blockchain.transactionId.slice(0, 10)}...
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Block:</strong> {submittedRequest.blockchain.blockNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Network:</strong> {submittedRequest.blockchain.network}
                  </Typography>
                  <Chip
                    label="View on BlockDAG Explorer"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={() => window.open(submittedRequest.blockchain.blockExplorerUrl, '_blank')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Alert>
      </Snackbar>
    </>
  );
};

RequestFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRequestSubmitted: PropTypes.func,
};

export default RequestFormModal;
