
// import { ElasticsearchService } from '@nestjs/elasticsearch';
// import { StoresService } from './stores.service';

// jest.mock('../src/services/elasticsearch.service'); // Mock the Elasticsearch service

// const mockElasticsearchService = {
//     search: jest.fn().mockResolvedValue({
//         hits: {
//             hits: [
//                 {
//                     _source: {
//                         location: {
//                             lat: 37.5214974888243,
//                             lon: 127.0383100292
//                         },
//                         // ... Add other fields as required for testing
//                     }
//                 },
//                 // ... Add more dummy hits if needed
//             ]
//         }
//     })
// };

// // Mock the Elasticsearch service instance
// ElasticsearchService.getInstance = jest.fn().mockReturnValue(mockElasticsearchService);

// describe('searchByCoord', () => {
//     test('should return stores with distances sorted by nearest', async () => {
//         // Set up test data and parameters
//         const southWestLatitude = 37.5;
//         const southWestLongitude = 126.9;
//         const northEastLatitude = 37.6;
//         const northEastLongitude = 127.1;
//         const userLatitude = 37.55;
//         const userLongitude = 127.0;

       
//         const result = await StoresService.searchByCoord(
//             southWestLatitude,
//             southWestLongitude,
//             northEastLatitude,
//             northEastLongitude,
//             userLatitude,
//             userLongitude
//         );

//         // Perform assertions
//         expect(mockElasticsearchService.search).toHaveBeenCalledWith({
//             index: 'geo_test',
//             size: 20,
//             query: {
//                 geo_bounding_box: {
//                     location: {
//                         top_left: {
//                             lat: northEastLatitude,
//                             lon: southWestLongitude
//                         },
//                         bottom_right: {
//                             lat: southWestLatitude,
//                             lon: northEastLongitude
//                         }
//                     }
//                 }
//             }
//         });

//         // Add more assertions based on the expected behavior of your function
//         // For example, check if the result is an array, the length is correct, and the distances are sorted properly.
//         // You can also check the values of specific fields in the result array.

//         // Example assertions:
//         expect(Array.isArray(result)).toBe(true);
//         expect(result.length).toBe(1);
//         expect(result[0].distance).toBeDefined();
//         expect(result[0].distance).toBe('123m');
//         // ...

//         // You can also assert the console.log statements if needed

//         // Verify the number of console.log calls
//         expect(console.log).toHaveBeenCalledTimes(2);

//         // Verify the specific console.log calls if needed
//         expect(console.log).toHaveBeenNthCalledWith(1, result);
//         expect(console.log).toHaveBeenNthCalledWith(2, result.length);
//     });
// });
