import { Client, ClientOptions } from './client';

export function createClient(options: ClientOptions) {
  return new Client(options);
}
