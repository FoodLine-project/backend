import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
  async getPublicIpAddress(): Promise<string> {
    try {
      const response = await axios.get('http://ip-api.com/json/');
      const { query } = response.data;
      return query;
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
