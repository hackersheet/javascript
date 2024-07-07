import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const HACKERSHEET_API_ENDPOINT = process.env.HACKERSHEET_API_ENDPOINT!;
export const HACKERSHEET_API_ACCESS_KEY = process.env.HACKERSHEET_API_ACCESS_KEY!;
