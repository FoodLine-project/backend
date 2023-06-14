// import { Injectable } from '@nestjs/common';
// import * as redis from 'redis';

// @Injectable()
// export class RedisService {
//   private client: redis.RedisClient;

//   constructor() {
//     this.client = redis.createClient(); // Create a new Redis client
//   }

//   set(key: string, value: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       this.client.set(key, value, (err, reply) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(reply);
//         }
//       });
//     });
//   }

//   get(key: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       this.client.get(key, (err, reply) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(reply);
//         }
//       });
//     });
//   }
// }
