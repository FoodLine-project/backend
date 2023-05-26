import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
  // async getCurrentLocation() {
  //   try {
  //     const response = await axios.get("http://ip-api.com/json");
  //     const { city, regionName, country } = response.data;
  //     console.log()
  //   }
  // }
  async getPublicIpAddress(): Promise<{ lat: number; lon: number }> {
    try {
      const response = await axios.get('http://ip-api.com/json/');
      const { lat, lon } = response.data;

      return { lat, lon };
      // const { query } = response.data;
      // return query;
    } catch (error) {
      console.error('Error retrieving public IP address:', error);
      throw error;
    }
  }

  async getLatAndLonOfIpAddress(
    ipAddress: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const API_KEY = 'F8836A600EB5299CF89F9D127A6BFC2C';
    const response = await axios.get(
      `https://api.ip2location.io/?key=${API_KEY}&ip=${ipAddress}`,
    );

    const { latitude, longitude } = response.data;

    return { latitude, longitude };
  }
}
