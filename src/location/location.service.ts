import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
  async getCoordinatesOfIpAddress(): Promise<any> {
    const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');

    const { latitude, longitude } = response.data;

    return { latitude, longitude };
  }
}
