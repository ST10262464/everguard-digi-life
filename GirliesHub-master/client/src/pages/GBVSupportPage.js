import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LocationService from '../services/locationService';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Autocomplete,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Security,
  Phone,
  LocationOn,
  AccessTime,
  Home,
  LocalHospital,
  Gavel,
  Warning,
  EmergencyShare,
  MyLocation,
  Directions,
  Map,
  Sort,
  Refresh,
} from '@mui/icons-material';

const GBVSupportPage = () => {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [filteredShelters, setFilteredShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [showMap, setShowMap] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [allShelters, setAllShelters] = useState([]);

  const emergencyContacts = [
    {
      name: t('gbvSupport.emergencyContacts.contacts.gbvCommand.name'),
      number: t('gbvSupport.emergencyContacts.contacts.gbvCommand.number'),
      description: t('gbvSupport.emergencyContacts.contacts.gbvCommand.description'),
      type: 'emergency'
    },
    {
      name: t('gbvSupport.emergencyContacts.contacts.police.name'),
      number: t('gbvSupport.emergencyContacts.contacts.police.number'),
      description: t('gbvSupport.emergencyContacts.contacts.police.description'),
      type: 'emergency'
    },
    {
      name: t('gbvSupport.emergencyContacts.contacts.lifeline.name'),
      number: t('gbvSupport.emergencyContacts.contacts.lifeline.number'),
      description: t('gbvSupport.emergencyContacts.contacts.lifeline.description'),
      type: 'support'
    },
    {
      name: t('gbvSupport.emergencyContacts.contacts.childline.name'),
      number: t('gbvSupport.emergencyContacts.contacts.childline.number'),
      description: t('gbvSupport.emergencyContacts.contacts.childline.description'),
      type: 'support'
    }
  ];

  // Debounce utility function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounced location search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLocationSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const suggestions = await LocationService.getLocationSuggestions(query);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300),
    [debounce]
  );

  // Handle address input change
  const handleAddressInputChange = (event, newInputValue) => {
    setSearchAddress(newInputValue);
    debouncedLocationSearch(newInputValue);
  };

  // Handle address selection
  const handleAddressSelection = async (event, selectedLocation) => {
    if (!selectedLocation) {
      setSearchAddress('');
      setUserLocation(null);
      setFilteredShelters([]);
      return;
    }

    setSearchAddress(selectedLocation.display_name);
    setUserLocation({ lat: selectedLocation.lat, lng: selectedLocation.lon });
    setLocationSuggestions([]);
    
    // Fetch nearby shelters
    await fetchNearbyShelters(selectedLocation.lat, selectedLocation.lon);
  };

  // Fetch nearby shelters from API
  const fetchNearbyShelters = async (lat, lng) => {
    setIsLoading(true);
    try {
      const shelters = await LocationService.getNearbyShelters(lat, lng, 50);
      setAllShelters(shelters);
      setFilteredShelters(shelters);
    } catch (error) {
      console.error('Error fetching nearby shelters:', error);
      // Fallback to mock data
      const mockShelters = LocationService.getMockShelters(lat, lng);
      setAllShelters(mockShelters);
      setFilteredShelters(mockShelters);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = async () => {
    setIsLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      setSearchAddress(`Current Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
      await fetchNearbyShelters(location.lat, location.lng);
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Unable to get your current location. Please enter an address manually.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort shelters based on selected criteria
  const sortShelters = (shelters, sortBy) => {
    return [...shelters].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'availability': {
          const availabilityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
          return availabilityOrder[a.availability] - availabilityOrder[b.availability];
        }
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  // Get directions to shelter
  const getDirections = (shelter) => {
    const { lat, lng } = shelter.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Get capacity color
  const getCapacityColor = (capacity) => {
    const available = t('gbvSupport.safeShelters.capacity.available').toLowerCase();
    const limited = t('gbvSupport.safeShelters.capacity.limited').toLowerCase();
    const full = t('gbvSupport.safeShelters.capacity.full').toLowerCase();
    
    switch (capacity.toLowerCase()) {
      case available:
        return 'success';
      case limited:
        return 'warning';
      case full:
        return 'error';
      default:
        return 'default';
    }
  };

  // Get contact type icon
  const getContactTypeIcon = (type) => {
    return type === 'emergency' ? <EmergencyShare /> : <Phone />;
  };

  // Get availability color
  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  // Enhanced filtering and sorting system
  useEffect(() => {
    let filtered = [...allShelters];
    
    // Apply emergency mode filter
    if (emergencyMode) {
      filtered = filtered.filter(shelter => shelter.availability === 'high');
    }
    
    // Sort the filtered results
    filtered = sortShelters(filtered, sortBy);
    
    setFilteredShelters(filtered);
  }, [sortBy, emergencyMode, allShelters]);



  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Security sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
            {t('gbvSupport.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            {t('gbvSupport.subtitle')}
          </Typography>
        </Box>

        {/* Emergency Alert */}
        <Alert 
          severity="error" 
          sx={{ mb: 4, fontSize: '1.1rem' }}
          icon={<Warning />}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {t('gbvSupport.emergencyAlert.title')}
          </Typography>
          <Typography>
            {t('gbvSupport.emergencyAlert.description')}
          </Typography>
        </Alert>

        {/* Location Search Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Find Nearby Shelters
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={locationSuggestions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.display_name || '';
                  }}
                  value={searchAddress}
                  onChange={handleAddressSelection}
                  onInputChange={handleAddressInputChange}
                  loading={suggestionsLoading}
                  filterOptions={(x) => x} // Disable built-in filtering
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Enter your address or location"
                      variant="outlined"
                      fullWidth
                      placeholder="e.g., Cape Town, Johannesburg, Durban"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {suggestionsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.display_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.type} • {option.importance ? option.importance.toFixed(2) : 'N/A'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  startIcon={<MyLocation />}
                  onClick={getUserLocation}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Use My Location'}
                </Button>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emergencyMode}
                      onChange={(e) => setEmergencyMode(e.target.checked)}
                      color="error"
                    />
                  }
                  label="Emergency Mode"
                />
              </Grid>
            </Grid>

            {/* Controls */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sort />
                <Typography variant="body2">Sort by:</Typography>
                <Button
                  size="small"
                  variant={sortBy === 'distance' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('distance')}
                >
                  Distance
                </Button>
                <Button
                  size="small"
                  variant={sortBy === 'availability' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('availability')}
                >
                  Availability
                </Button>
                <Button
                  size="small"
                  variant={sortBy === 'name' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('name')}
                >
                  Name
                </Button>
              </Box>
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<Map />}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  setSearchAddress('');
                  setUserLocation(null);
                  setEmergencyMode(false);
                  setSortBy('distance');
                  setFilteredShelters([]);
                  setAllShelters([]);
                }}
              >
                Reset
              </Button>
            </Box>

            {/* User Location Display */}
            {userLocation && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Searching for shelters near: {searchAddress}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Safe Shelters */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('gbvSupport.safeShelters.title')}
                {userLocation && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    ({filteredShelters.length} shelters found)
                  </Typography>
                )}
              </Typography>
            </Box>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredShelters.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <LocationOn sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No shelters found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter a location above to find nearby shelters
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              filteredShelters.map((shelter, index) => (
                <Card 
                  key={shelter.id} 
                  sx={{ 
                    mb: 3, 
                    border: emergencyMode ? '2px solid #f44336' : '1px solid #e0e0e0',
                    backgroundColor: emergencyMode ? '#fff5f5' : 'white'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                          {shelter.name}
                          {index === 0 && userLocation && (
                            <Chip 
                              label="Closest" 
                              color="success" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        {shelter.distance && (
                          <Typography variant="body2" color="text.secondary">
                            {shelter.distance.toFixed(1)} km away
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={shelter.capacity}
                          color={getCapacityColor(shelter.capacity)}
                          size="small"
                        />
                        <Chip
                          label={shelter.availability}
                          color={getAvailabilityColor(shelter.availability)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {shelter.description}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('gbvSupport.safeShelters.address')}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ ml: 3 }}>{shelter.address}</Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccessTime sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('gbvSupport.safeShelters.hours')}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ ml: 3 }}>{shelter.operatingHours}</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>{t('gbvSupport.safeShelters.contactNumbers')}</Typography>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body2">
                              <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {t('gbvSupport.safeShelters.general')}: {shelter.phone}
                            </Typography>
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                              <EmergencyShare sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {t('gbvSupport.safeShelters.emergency')}: {shelter.emergency}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>{t('gbvSupport.safeShelters.servicesAvailable')}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {shelter.services.map((service, index) => (
                          <Chip
                            key={index}
                            label={service}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button 
                        variant="contained" 
                        color="error"
                        startIcon={<Phone />}
                        href={`tel:${shelter.emergency}`}
                        size={emergencyMode ? "large" : "medium"}
                      >
                        {t('gbvSupport.safeShelters.emergencyCall')}
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<Phone />}
                        href={`tel:${shelter.phone}`}
                      >
                        {t('gbvSupport.safeShelters.generalContact')}
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<Directions />}
                        onClick={() => getDirections(shelter)}
                      >
                        Get Directions
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>

          {/* Emergency Contacts */}
          <Grid item xs={12} lg={4}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('gbvSupport.emergencyContacts.title')}
            </Typography>
            
            <Card>
              <CardContent sx={{ p: 0 }}>
                <List>
                  {emergencyContacts.map((contact, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getContactTypeIcon(contact.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {contact.name}
                              </Typography>
                            }
                          />
                        </Box>
                        <Box sx={{ pl: 5, width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            color={contact.type === 'emergency' ? 'error.main' : 'primary.main'}
                            sx={{ fontWeight: 'bold', mb: 1 }}
                          >
                            {contact.number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {contact.description}
                          </Typography>
                          <Button
                            variant={contact.type === 'emergency' ? 'contained' : 'outlined'}
                            color={contact.type === 'emergency' ? 'error' : 'primary'}
                            size="small"
                            startIcon={<Phone />}
                            href={`tel:${contact.number}`}
                            fullWidth
                          >
                            {t('gbvSupport.emergencyContacts.callNow')}
                          </Button>
                        </Box>
                      </ListItem>
                      {index < emergencyContacts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('gbvSupport.legalResources.title')}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Gavel fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('gbvSupport.legalResources.legalAid.name')} 
                      secondary={t('gbvSupport.legalResources.legalAid.description')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocalHospital fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('gbvSupport.legalResources.medicalSupport.name')} 
                      secondary={t('gbvSupport.legalResources.medicalSupport.description')}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default GBVSupportPage;
