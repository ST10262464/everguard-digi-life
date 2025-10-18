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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalHospital,
  LocationOn,
  AccessTime,
  Phone,
  Inventory,
  Schedule,
  Info,
  CheckCircle,
  Search,
  Map,
  MyLocation,
  Directions,
  Refresh,
  Notifications,
  Warning,
  Sort,
  ViewList,
  ViewModule,
} from '@mui/icons-material';

const SanitaryAidPage = () => {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [filteredBins, setFilteredBins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list or grid
  const [sortBy, setSortBy] = useState('distance'); // distance, status, lastRestocked
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [allBins, setAllBins] = useState([]);

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
      setFilteredBins([]);
      return;
    }

    setSearchAddress(selectedLocation.display_name);
    setUserLocation({ lat: selectedLocation.lat, lng: selectedLocation.lon });
    setLocationSuggestions([]);
    
    // Fetch nearby donation bins
    await fetchNearbyBins(selectedLocation.lat, selectedLocation.lon);
  };

  // Fetch nearby donation bins from API
  const fetchNearbyBins = async (lat, lng) => {
    setIsLoading(true);
    try {
      // For now, we'll use the mock data but with real location filtering
      const mockBins = getMockDonationBins();
      const binsWithDistance = mockBins.map(bin => ({
        ...bin,
        distance: LocationService.calculateDistance(lat, lng, bin.coordinates.lat, bin.coordinates.lng)
      }));
      
      setAllBins(binsWithDistance);
      setFilteredBins(binsWithDistance);
    } catch (error) {
      console.error('Error fetching nearby donation bins:', error);
      // Fallback to mock data
      const mockBins = getMockDonationBins();
      setAllBins(mockBins);
      setFilteredBins(mockBins);
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
      await fetchNearbyBins(location.lat, location.lng);
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Unable to get your current location. Please enter an address manually.');
    } finally {
      setIsLoading(false);
    }
  };



  // Enhanced donation bin data with coordinates and real-time stock
  const getMockDonationBins = () => [
    {
      id: 1,
      name: "Cape Town Central Library",
      address: "1 Roeland Street, Cape Town, Western Cape, 8001",
      phone: "+27 21 461 1111",
      operatingHours: "Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM",
      availableItems: ["Sanitary Pads", "Tampons", "Soap", "Underwear"],
      lastRestocked: '2025-08-28',
      status: "Well Stocked",
      description: "Free access to essential hygiene products for women in need.",
      contactPerson: "Sarah Johnson",
      coordinates: { lat: -33.9249, lng: 18.4241 }, // Cape Town
      distance: null,
      stockLevels: {
        sanitaryPads: 85,
        tampons: 92,
        soap: 78,
        underwear: 45
      },
      nextRestock: '2025-09-02',
      priority: 'low'
    },
    {
      id: 2,
      name: "Frida Hartley Shelter",
      address: "97 Regent St, Johannesburg, 2001",
      phone: "+27 11 648 6005",
      operatingHours: "Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM",
      availableItems: ["Sanitary Pads", "Tampons", "Menstrual Cups", "Soap", "Toilet Paper"],
      lastRestocked: '2025-08-29',
      status: "Well Stocked",
      description: "Non-profit organization providing comprehensive support including hygiene products.",
      contactPerson: "Frida Hartley",
      coordinates: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
      distance: null,
      stockLevels: {
        sanitaryPads: 95,
        tampons: 88,
        menstrualCups: 12,
        soap: 82,
        toiletPaper: 90
      },
      nextRestock: '2025-09-03',
      priority: 'low'
    },
    {
      id: 3,
      name: "Bienvenu Shelter",
      address: "36 Terrace Rd, Johannesburg, 2001",
      phone: "+27 11 624 2915",
      operatingHours: "24/7 Emergency Access",
      availableItems: ["Sanitary Pads", "Soap", "Shampoo", "Toothbrush", "Toothpaste"],
      lastRestocked: '2025-08-26',
      status: "Low Stock",
      description: "Women's shelter providing a safe environment with hygiene products.",
      contactPerson: "Bienvenu Staff",
      coordinates: { lat: -26.1989, lng: 28.0447 }, // Johannesburg
      distance: null,
      stockLevels: {
        sanitaryPads: 25,
        soap: 15,
        shampoo: 8,
        toothbrush: 12,
        toothpaste: 20
      },
      nextRestock: '2025-08-31',
      priority: 'high'
    },
    // Add more donation bins for better coverage
    {
      id: 4,
      name: "Pretoria Central Library",
      address: "456 Church Street, Pretoria Central, Gauteng",
      phone: "+27 12 345 6789",
      operatingHours: "Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM",
      availableItems: [t('sanitaryAid.donationBins.items.sanitaryPads'), t('sanitaryAid.donationBins.items.tampons'), t('sanitaryAid.donationBins.items.soap'), t('sanitaryAid.donationBins.items.toothbrush')],
      lastRestocked: '2025-08-27',
      status: t('sanitaryAid.donationBins.status.wellStocked'),
      description: "Free access to essential hygiene products for women in need.",
      contactPerson: "Maria van der Merwe",
      coordinates: { lat: -25.7479, lng: 28.2293 }, // Pretoria
      distance: null,
      stockLevels: {
        sanitaryPads: 75,
        tampons: 68,
        soap: 82,
        toothbrush: 45
      },
      nextRestock: '2025-09-01',
      priority: 'medium'
    },
    {
      id: 5,
      name: "Port Elizabeth Community Center",
      address: "789 Govan Mbeki Avenue, Port Elizabeth Central, Eastern Cape",
      phone: "+27 41 234 5678",
      operatingHours: "Mon-Sat: 8:00 AM - 5:00 PM, Sun: Closed",
      availableItems: [t('sanitaryAid.donationBins.items.sanitaryPads'), t('sanitaryAid.donationBins.items.soap'), t('sanitaryAid.donationBins.items.underwear'), t('sanitaryAid.donationBins.items.toiletPaper')],
      lastRestocked: '2025-08-25',
      status: t('sanitaryAid.donationBins.status.lowStock'),
      description: "Community-supported donation bin. Help yourself to what you need.",
      contactPerson: "Nokuthula Dlamini",
      coordinates: { lat: -33.7139, lng: 25.5207 }, // Port Elizabeth
      distance: null,
      stockLevels: {
        sanitaryPads: 18,
        soap: 12,
        underwear: 8,
        toiletPaper: 15
      },
      nextRestock: '2025-08-30',
      priority: 'high'
    },
  ];

  const hygieneTips = [
    {
      title: t('sanitaryAid.hygieneTips.menstrualHygiene.title'),
      tips: [
        t('sanitaryAid.hygieneTips.menstrualHygiene.tips.tip1'),
        t('sanitaryAid.hygieneTips.menstrualHygiene.tips.tip2'),
        t('sanitaryAid.hygieneTips.menstrualHygiene.tips.tip3'),
        t('sanitaryAid.hygieneTips.menstrualHygiene.tips.tip4')
      ]
    },
    {
      title: t('sanitaryAid.hygieneTips.generalHygiene.title'),
      tips: [
        t('sanitaryAid.hygieneTips.generalHygiene.tips.tip1'),
        t('sanitaryAid.hygieneTips.generalHygiene.tips.tip2'),
        t('sanitaryAid.hygieneTips.generalHygiene.tips.tip3'),
        t('sanitaryAid.hygieneTips.generalHygiene.tips.tip4')
      ]
    },
    {
      title: t('sanitaryAid.hygieneTips.emergencyAlternatives.title'),
      tips: [
        t('sanitaryAid.hygieneTips.emergencyAlternatives.tips.tip1'),
        t('sanitaryAid.hygieneTips.emergencyAlternatives.tips.tip2'),
        t('sanitaryAid.hygieneTips.emergencyAlternatives.tips.tip3'),
        t('sanitaryAid.hygieneTips.emergencyAlternatives.tips.tip4')
      ]
    }
  ];



  // Product options for filtering
  const productOptions = [
    { value: 'all', label: 'All Products' },
    { value: 'sanitaryPads', label: t('sanitaryAid.donationBins.items.sanitaryPads') },
    { value: 'tampons', label: t('sanitaryAid.donationBins.items.tampons') },
    { value: 'soap', label: t('sanitaryAid.donationBins.items.soap') },
    { value: 'underwear', label: t('sanitaryAid.donationBins.items.underwear') },
    { value: 'toothbrush', label: t('sanitaryAid.donationBins.items.toothbrush') },
    { value: 'toothpaste', label: t('sanitaryAid.donationBins.items.toothpaste') },
  ];

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'wellStocked', label: t('sanitaryAid.donationBins.status.wellStocked') },
    { value: 'lowStock', label: t('sanitaryAid.donationBins.status.lowStock') },
    { value: 'outOfStock', label: t('sanitaryAid.donationBins.status.outOfStock') },
  ];

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get directions to bin
  const getDirections = (bin) => {
    const { lat, lng } = bin.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Get stock level color
  const getStockLevelColor = (level) => {
    if (level >= 70) return 'success';
    if (level >= 30) return 'warning';
    return 'error';
  };

  // Get status color
  const getStatusColor = (status) => {
    const wellStocked = t('sanitaryAid.donationBins.status.wellStocked').toLowerCase();
    const lowStock = t('sanitaryAid.donationBins.status.lowStock').toLowerCase();
    const outOfStock = t('sanitaryAid.donationBins.status.outOfStock').toLowerCase();
    
    switch (status.toLowerCase()) {
      case wellStocked:
        return 'success';
      case lowStock:
        return 'warning';
      case outOfStock:
        return 'error';
      default:
        return 'default';
    }
  };

  // Get days ago
  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check for stock alerts
  const checkStockAlerts = () => {
    const mockBins = getMockDonationBins();
    const alerts = mockBins.filter(bin => {
      const lowStockItems = Object.entries(bin.stockLevels).filter(([, level]) => level < 30);
      return lowStockItems.length > 0;
    }).map(bin => ({
      binId: bin.id,
      binName: bin.name,
      lowStockItems: Object.entries(bin.stockLevels).filter(([, level]) => level < 30)
    }));
    setStockAlerts(alerts);
  };

  // Initialize
  useEffect(() => {
    const mockBins = getMockDonationBins();
    setAllBins(mockBins);
    setFilteredBins(mockBins);
    checkStockAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced filtering and sorting system
  useEffect(() => {
    let filtered = [...allBins];

    // Filter by product
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(bin => 
        bin.availableItems.some(item => 
          item.toLowerCase().includes(selectedProduct.toLowerCase())
        )
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(bin => 
        bin.status.toLowerCase().includes(selectedStatus.toLowerCase())
      );
    }

    // Filter by low stock only
    if (showLowStockOnly) {
      filtered = filtered.filter(bin => 
        bin.status.toLowerCase().includes('low') || bin.status.toLowerCase().includes('out')
      );
    }

    // Add distances if user location is available
    if (userLocation) {
      filtered = filtered.map(bin => ({
        ...bin,
        distance: calculateDistance(
          userLocation.lat, userLocation.lng,
          bin.coordinates.lat, bin.coordinates.lng
        )
      }));
    }

    // Sort bins
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'status': {
          const statusOrder = { 'wellStocked': 1, 'lowStock': 2, 'outOfStock': 3 };
          return statusOrder[a.status.toLowerCase()] - statusOrder[b.status.toLowerCase()];
        }
        case 'lastRestocked':
          return new Date(b.lastRestocked) - new Date(a.lastRestocked);
        default:
          return 0;
      }
    });

    setFilteredBins(filtered);
  }, [selectedProduct, selectedStatus, showLowStockOnly, sortBy, userLocation, allBins]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {t('sanitaryAid.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            {t('sanitaryAid.subtitle')}
          </Typography>
        </Box>

        {/* Stock Alerts */}
        {stockAlerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
              Low Stock Alerts
            </Typography>
            <Typography variant="body2">
              {stockAlerts.length} donation bin(s) have low stock levels and need restocking.
            </Typography>
          </Alert>
        )}

        {/* Search and Filter Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
              Find Donation Bins
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
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
                      label="Enter your location"
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
              
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<MyLocation />}
                  onClick={getUserLocation}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={20} /> : 'My Location'}
                </Button>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    label="Product"
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    {productOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLowStockOnly}
                      onChange={(e) => setShowLowStockOnly(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Low Stock Only"
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
                  variant={sortBy === 'status' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('status')}
                >
                  Status
                </Button>
                <Button
                  size="small"
                  variant={sortBy === 'lastRestocked' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('lastRestocked')}
                >
                  Last Restocked
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
                startIcon={viewMode === 'list' ? <ViewModule /> : <ViewList />}
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </Button>
              
                             <Button
                 size="small"
                 variant="outlined"
                 startIcon={<Refresh />}
                 onClick={() => {
                   setSearchAddress('');
                   setUserLocation(null);
                   setSelectedProduct('all');
                   setSelectedStatus('all');
                   setShowLowStockOnly(false);
                   setSortBy('distance');
                   setViewMode('list');
                   setShowMap(false);
                   setFilteredBins([]);
                   setAllBins([]);
                 }}
               >
                 Reset
               </Button>
            </Box>

            {/* User Location Display */}
            {userLocation && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Searching for donation bins near: {searchAddress || `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Donation Bins */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('sanitaryAid.donationBins.title')}
                {userLocation && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    ({filteredBins.length} bins found)
                  </Typography>
                )}
            </Typography>
            </Box>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredBins.map((bin, index) => (
                  <Grid item xs={12} key={bin.id}>
                    <Card sx={{ 
                      border: bin.priority === 'high' ? '2px solid #f57c00' : '1px solid #e0e0e0',
                      backgroundColor: bin.priority === 'high' ? '#fff8e1' : 'white'
                    }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                      {bin.name}
                              {index === 0 && userLocation && (
                                <Chip 
                                  label="Closest" 
                                  color="success" 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                              {bin.priority === 'high' && (
                                <Chip 
                                  label="High Priority" 
                                  color="warning" 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            {bin.distance && (
                              <Typography variant="body2" color="text.secondary">
                                {bin.distance.toFixed(1)} km away
                    </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={bin.status}
                      color={getStatusColor(bin.status)}
                              size="small"
                            />
                            <Chip
                              label={`${Object.keys(bin.stockLevels).length} items`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                  </Box>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {bin.description}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('sanitaryAid.donationBins.address')}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 3 }}>{bin.address}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTime sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('sanitaryAid.donationBins.hours')}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 3 }}>{bin.operatingHours}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('sanitaryAid.donationBins.contact')}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 3 }}>
                          {bin.contactPerson} - {bin.phone}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Stock Levels</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 2 }}>
                                {Object.entries(bin.stockLevels).map(([item, level]) => (
                            <Chip
                                    key={item}
                                    label={`${item}: ${level}%`}
                              size="small"
                                    color={getStockLevelColor(level)}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Schedule sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t('sanitaryAid.donationBins.lastRestocked')}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 3 }}>
                          {getDaysAgo(bin.lastRestocked)} {t('sanitaryAid.donationBins.daysAgo')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained"
                      startIcon={<Phone />}
                      href={`tel:${bin.phone}`}
                    >
                      {t('sanitaryAid.donationBins.callLocation')}
                    </Button>
                    <Button 
                      variant="outlined"
                            startIcon={<Directions />}
                            onClick={() => getDirections(bin)}
                    >
                      {t('sanitaryAid.donationBins.getDirections')}
                    </Button>
                          <Button 
                            variant="outlined"
                            startIcon={<Notifications />}
                            onClick={() => {
                              // Mock notification subscription
                              alert(`You'll be notified when ${bin.name} needs restocking!`);
                            }}
                          >
                            Get Alerts
                          </Button>
                  </Box>
                </CardContent>
              </Card>
                  </Grid>
            ))}
              </Grid>
            )}
          </Grid>

          {/* Hygiene Tips & Info */}
          <Grid item xs={12} lg={4}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('sanitaryAid.hygieneTips.title')}
            </Typography>
            
            {hygieneTips.map((section, sectionIndex) => (
              <Card key={sectionIndex} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {section.title}
                  </Typography>
                  <List dense>
                    {section.tips.map((tip, tipIndex) => (
                      <ListItem key={tipIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                            {tipIndex + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={tip}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}

            {/* Donation Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  {t('sanitaryAid.donation.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('sanitaryAid.donation.description')}
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('sanitaryAid.donation.items.sanitaryProducts')}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('sanitaryAid.donation.items.hygieneItems')}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={t('sanitaryAid.donation.items.underwear')}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  {t('sanitaryAid.donation.learnMore')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SanitaryAidPage;
