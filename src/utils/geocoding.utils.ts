// Type definitions for Nominatim API responses
interface NominatimAddress {
  village?: string;
  hamlet?: string;
  locality?: string;
  suburb?: string;
  city?: string;
  town?: string;
  district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimReverseResponse {
  address?: NominatimAddress;
  display_name?: string;
  lat?: string;
  lon?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Reverse geocoding to convert latitude and longitude to a readable address
 * Uses OpenStreetMap's Nominatim API (free, no API key required)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HRMS-App/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: NominatimReverseResponse = await response.json();
    
    if (!data || !data.address) {
      return `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
    }

    const address = data.address;
    
    // Build a formatted address with pincode
    const parts: string[] = [];
    
    // Add village/hamlet/locality
    if (address.village) parts.push(address.village);
    else if (address.hamlet) parts.push(address.hamlet);
    else if (address.locality) parts.push(address.locality);
    else if (address.suburb) parts.push(address.suburb);
    
    // Add city/town
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.district) parts.push(address.district);
    
    // Add state
    if (address.state) parts.push(address.state);
    
    // Add pincode/postcode
    if (address.postcode) parts.push(address.postcode);
    
    // If we couldn't build a proper address, use the display name
    if (parts.length === 0 && data.display_name) {
      // Extract just the address parts from display name
      const displayNameParts = data.display_name.split(',').slice(0, 4);
      return displayNameParts.join(',').trim();
    }
    
    return parts.length > 0 ? parts.join(', ') : data.display_name || `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
  }
}

/**
 * Get coordinates from an address (forward geocoding)
 */
export async function geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HRMS-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json() as NominatimSearchResult[];
    
    if (!data || data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
