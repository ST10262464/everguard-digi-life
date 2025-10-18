import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Event,
  LocationOn,
  Person,
  AccessTime,
  Search,
  FilterList,
  Calculate,
  CheckCircle,
} from '@mui/icons-material';

const FinancePage = () => {
  const { t } = useTranslation();
  
  // State for interactive features
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phone: '',
    reason: ''
  });
  const [registeredSeminars, setRegisteredSeminars] = useState([]);
  const [calculatorDialog, setCalculatorDialog] = useState(false);
  const [calculatorValues, setCalculatorValues] = useState({
    monthlyIncome: 5000,
    monthlyExpenses: 3000,
    savingsGoal: 10000,
    monthsToGoal: 12
  });
  
  const getUpcomingSeminars = () => [
    {
      id: 1,
      title: t('finance.seminars.seminar1.title'),
      date: '2025-09-15',
      time: t('finance.seminars.seminar1.time'),
      location: t('finance.seminars.seminar1.location'),
      facilitator: t('finance.seminars.seminar1.facilitator'),
      description: t('finance.seminars.seminar1.description'),
      spots: 25,
    },
    {
      id: 2,
      title: t('finance.seminars.seminar2.title'),
      date: '2025-09-22',
      time: t('finance.seminars.seminar2.time'),
      location: t('finance.seminars.seminar2.location'),
      facilitator: t('finance.seminars.seminar2.facilitator'),
      description: t('finance.seminars.seminar2.description'),
      spots: 15,
    },
    {
      id: 3,
      title: t('finance.seminars.seminar3.title'),
      date: '2025-09-28',
      time: t('finance.seminars.seminar3.time'),
      location: t('finance.seminars.seminar3.location'),
      facilitator: t('finance.seminars.seminar3.facilitator'),
      description: t('finance.seminars.seminar3.description'),
      spots: 30,
    },
  ];
  
  const [seminars, setSeminars] = useState([]);
  
  // Update seminars when language changes
  useEffect(() => {
    setSeminars(getUpcomingSeminars());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Filter seminars based on search and category
  const filteredSeminars = seminars.filter(seminar => {
    const matchesSearch = seminar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seminar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seminar.facilitator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || seminar.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle seminar registration
  const handleRegister = (seminar) => {
    setSelectedSeminar(seminar);
    setRegistrationDialog(true);
  };

  const handleRegistrationSubmit = () => {
    if (registrationForm.name && registrationForm.email) {
      setRegisteredSeminars([...registeredSeminars, {
        ...selectedSeminar,
        registration: registrationForm,
        registeredAt: new Date().toISOString()
      }]);
      setRegistrationDialog(false);
      setRegistrationForm({ name: '', email: '', phone: '', reason: '' });
      setSelectedSeminar(null);
    }
  };

  const isRegistered = (seminarId) => {
    return registeredSeminars.some(seminar => seminar.id === seminarId);
  };

  // Financial calculator functions
  const calculateSavings = () => {
    const { monthlyIncome, monthlyExpenses, savingsGoal, monthsToGoal } = calculatorValues;
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const totalSavings = monthlySavings * monthsToGoal;
    const goalAchieved = totalSavings >= savingsGoal;
    const additionalMonths = goalAchieved ? 0 : Math.ceil((savingsGoal - totalSavings) / monthlySavings);
    
    return {
      monthlySavings,
      totalSavings,
      goalAchieved,
      additionalMonths
    };
  };

  const calculatorResults = calculateSavings();

  const getFinancialTips = () => [
    {
      title: t('finance.tips.emergencyFund.title'),
      description: t('finance.tips.emergencyFund.description'),
      category: t('finance.categories.savings'),
    },
    {
      title: t('finance.tips.education.title'),
      description: t('finance.tips.education.description'),
      category: t('finance.categories.education'),
    },
    {
      title: t('finance.tips.diversifyIncome.title'),
      description: t('finance.tips.diversifyIncome.description'),
      category: t('finance.categories.income'),
    },
    {
      title: t('finance.tips.retirement.title'),
      description: t('finance.tips.retirement.description'),
      category: t('finance.categories.planning'),
    },
    {
      title: t('finance.tips.trackExpenses.title'),
      description: t('finance.tips.trackExpenses.description'),
      category: t('finance.categories.budgeting'),
    },
  ];
  
  const financialTips = getFinancialTips();

  const getCategoryColor = (category) => {
    const colors = {
      [t('finance.categories.savings')]: '#4CAF50',
      [t('finance.categories.education')]: '#2196F3',
      [t('finance.categories.income')]: '#FF9800',
      [t('finance.categories.planning')]: '#9C27B0',
      [t('finance.categories.budgeting')]: '#F44336',
    };
    return colors[category] || '#757575';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <AccountBalance sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('finance.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('finance.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Upcoming Seminars */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('finance.upcomingSeminars')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Financial Calculator">
                  <IconButton 
                    color="primary" 
                    onClick={() => setCalculatorDialog(true)}
                    sx={{ border: '1px solid', borderColor: 'primary.main' }}
                  >
                    <Calculate />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Search and Filter Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search seminars..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        label="Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        <MenuItem value="budgeting">Budgeting</MenuItem>
                        <MenuItem value="investing">Investing</MenuItem>
                        <MenuItem value="savings">Savings</MenuItem>
                        <MenuItem value="entrepreneurship">Entrepreneurship</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      fullWidth
                    >
                      Reset
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {filteredSeminars.length === 0 ? (
              <Alert severity="info">
                No seminars found matching your search criteria. Try adjusting your filters.
              </Alert>
            ) : (
              filteredSeminars.map((seminar) => (
              <Card key={seminar.id} sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                      {seminar.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {isRegistered(seminar.id) ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Registered"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={`${seminar.spots} ${t('finance.spotsAvailable')}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {seminar.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Event sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(seminar.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{seminar.time}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{seminar.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{seminar.facilitator}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Registration Button */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    {isRegistered(seminar.id) ? (
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircle />}
                        disabled
                      >
                        Already Registered
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleRegister(seminar)}
                        disabled={seminar.spots <= 0}
                      >
                        Register for Seminar
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
            )}
          </Grid>

          {/* Financial Tips */}
          <Grid item xs={12} lg={4}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('finance.financialTips')}
            </Typography>
            
            <Card>
              <CardContent sx={{ p: 0 }}>
                <List>
                  {financialTips.map((tip, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                bgcolor: getCategoryColor(tip.category),
                                width: 32,
                                height: 32,
                                fontSize: '0.875rem',
                              }}
                            >
                              {tip.category[0]}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {tip.title}
                              </Typography>
                            }
                          />
                          <Chip
                            label={tip.category}
                            size="small"
                            sx={{
                              bgcolor: getCategoryColor(tip.category),
                              color: 'white',
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
                          {tip.description}
                        </Typography>
                      </ListItem>
                      {index < financialTips.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Registration Status */}
            {registeredSeminars.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                    Your Registrations ({registeredSeminars.length})
                  </Typography>
                  <List dense>
                    {registeredSeminars.map((seminar, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={seminar.title}
                          secondary={`Registered on ${new Date(seminar.registeredAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {t('finance.quickStats')}
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    2,500+
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('finance.womenEmpowered')}
                  </Typography>
                  
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mt: 2 }}>
                    150+
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('finance.seminarsCompleted')}
                  </Typography>
                  
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mt: 2 }}>
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('finance.successRate')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Registration Dialog */}
        <Dialog open={registrationDialog} onClose={() => setRegistrationDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Register for: {selectedSeminar?.title}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={registrationForm.phone}
                  onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Why do you want to attend this seminar?"
                  multiline
                  rows={3}
                  value={registrationForm.reason}
                  onChange={(e) => setRegistrationForm({...registrationForm, reason: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegistrationDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRegistrationSubmit} 
              variant="contained"
              disabled={!registrationForm.name || !registrationForm.email}
            >
              Register
            </Button>
          </DialogActions>
        </Dialog>

        {/* Financial Calculator Dialog */}
        <Dialog open={calculatorDialog} onClose={() => setCalculatorDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calculate />
              Financial Savings Calculator
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Income</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={calculatorValues.monthlyIncome}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    monthlyIncome: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Expenses</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={calculatorValues.monthlyExpenses}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    monthlyExpenses: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Savings Goal</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={calculatorValues.savingsGoal}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    savingsGoal: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Months to Goal</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={calculatorValues.monthsToGoal}
                  onChange={(e) => setCalculatorValues({
                    ...calculatorValues,
                    monthsToGoal: parseInt(e.target.value) || 0
                  })}
                />
              </Grid>
              
              {/* Results */}
              <Grid item xs={12}>
                <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Your Savings Plan</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Monthly Savings</Typography>
                        <Typography variant="h6" color="primary">
                          R{calculatorResults.monthlySavings.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Total Savings</Typography>
                        <Typography variant="h6" color="success.main">
                          R{calculatorResults.totalSavings.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Goal Status</Typography>
                        <Typography variant="h6" color={calculatorResults.goalAchieved ? "success.main" : "warning.main"}>
                          {calculatorResults.goalAchieved ? "Achieved!" : "In Progress"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Additional Months</Typography>
                        <Typography variant="h6" color="info.main">
                          {calculatorResults.additionalMonths}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCalculatorDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default FinancePage;
