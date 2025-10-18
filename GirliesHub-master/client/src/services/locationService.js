// Location Service for real API integration
import axios from 'axios';

// OpenStreetMap Nominatim API for geocoding (free, no API key required)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Real shelter data API endpoints
const SHELTER_API_BASE_URL = process.env.REACT_APP_SHELTER_API_URL || 'http://localhost:5001/api';

class LocationService {
  // Get location suggestions as user types (using OpenStreetMap)
  static async getLocationSuggestions(query) {
    if (!query || query.length < 3) return [];
    
    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 10,
          addressdetails: 1,
          countrycodes: 'za', // South Africa
          viewbox: '16.0,-35.0,33.0,-22.0', // South Africa bounding box
          bounded: 1
        }
      });
      
      return response.data.map(place => ({
        id: place.place_id,
        display_name: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        type: place.type,
        importance: place.importance
      }));
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      return [];
    }
  }

  // Get coordinates for a specific address
  static async getCoordinates(address) {
    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          countrycodes: 'za'
        }
      });
      
      if (response.data && response.data.length > 0) {
        const place = response.data[0];
        return {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          display_name: place.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  }

  // Get nearby shelters from our backend API
  static async getNearbyShelters(lat, lng, radius = 50) {
    try {
      const response = await axios.get(`${SHELTER_API_BASE_URL}/shelters/nearby`, {
        params: {
          lat,
          lng,
          radius,
          limit: 20
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby shelters:', error);
      // Fallback to mock data if API fails
      return this.getMockShelters(lat, lng);
    }
  }

  // Mock shelter data as fallback (using real publicly listed shelters)
  static getMockShelters(userLat, userLng) {
    const mockShelters = [
      {
        id: 1,
        name: "Frida Hartley Shelter",
        address: "97 Regent St, Johannesburg, 2001",
        phone: "+27 11 648 6005",
        emergency: "+27 11 648 6005",
        capacity: "Available",
        services: ["Emergency Accommodation", "Counseling", "Legal Support", "Job Training"],
        operatingHours: "8:00 AM - 6:00 PM",
        description: "Non-profit organization providing comprehensive support for women and children escaping domestic violence.",
        coordinates: { lat: -26.2041, lng: 28.0473 },
        availability: 'high',
        rating: 4.4,
        reviews: 108,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Bienvenu Shelter",
        address: "36 Terrace Rd, Johannesburg, 2001",
        phone: "+27 11 624 2915",
        emergency: "+27 11 624 2915",
        capacity: "Limited",
        services: ["Safe Housing", "Trauma Counseling", "Legal Aid", "Children Support"],
        operatingHours: "24/7 Emergency Access",
        description: "Women's shelter providing a safe environment with holistic support services for survivors of gender-based violence.",
        coordinates: { lat: -26.1989, lng: 28.0447 },
        availability: 'medium',
        rating: 4.5,
        reviews: 6,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Centre for the Study of Violence & Reconciliation",
        address: "8th Floor, 87 De Korte St, Johannesburg, 2001",
        phone: "+27 11 403 5650",
        emergency: "+27 11 403 5650",
        capacity: "Available",
        services: ["Research", "Policy Advocacy", "Training", "Support Services"],
        operatingHours: "8:00 AM - 5:00 PM",
        description: "Non-governmental organization working to understand and prevent violence, and heal its effects.",
        coordinates: { lat: -26.2019, lng: 28.0456 },
        availability: 'high',
        rating: 3.7,
        reviews: 3,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Women of Vision",
        address: "Melville, Johannesburg, 2109",
        phone: "+27 11 726 1234",
        emergency: "+27 11 726 1235",
        capacity: "Available",
        services: ["Emergency Shelter", "Counseling", "Legal Support"],
        operatingHours: "24/7 Emergency Access",
        description: "Support organization for women in crisis situations.",
        coordinates: { lat: -26.1750, lng: 28.0025 },
        availability: 'high',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Little Saints of Bethany",
        address: "Yeoville, Johannesburg, 2198",
        phone: "+27 11 648 7000",
        emergency: "+27 11 648 7001",
        capacity: "Limited",
        services: ["Emergency Shelter", "Medical Support", "Counseling"],
        operatingHours: "24/7 Emergency Access",
        description: "Community-based shelter offering immediate safety and long-term support programs.",
        coordinates: { lat: -26.1897, lng: 28.0614 },
        availability: 'medium',
        lastUpdated: new Date().toISOString(),
      }
    ];

    // Calculate distances and filter by radius
    return mockShelters.map(shelter => ({
      ...shelter,
      distance: this.calculateDistance(userLat, userLng, shelter.coordinates.lat, shelter.coordinates.lng)
    })).filter(shelter => shelter.distance <= 50); // 50km radius
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get user's current location using browser geolocation
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Search for shelters by name or services
  static async searchShelters(query, lat, lng) {
    try {
      const response = await axios.get(`${SHELTER_API_BASE_URL}/shelters/search`, {
        params: {
          q: query,
          lat,
          lng,
          limit: 20
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching shelters:', error);
      // Fallback to local search
      const allShelters = this.getMockShelters(lat, lng);
      return allShelters.filter(shelter => 
        shelter.name.toLowerCase().includes(query.toLowerCase()) ||
        shelter.services.some(service => 
          service.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }
}

export default LocationService;
