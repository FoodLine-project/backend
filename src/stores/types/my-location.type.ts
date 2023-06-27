import { float } from '@elastic/elasticsearch/lib/api/types';

export type MyLocation = {
  myLatitude: float;
  myLongitude: float;
};
