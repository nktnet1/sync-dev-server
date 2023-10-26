import { protocol, host, port } from './config.json';

export const PORT: number = parseInt(process.env.PORT || port.toString());
export const HOST: string = process.env.IP || host;
export const PROTOCOL: string = process.env.PROTOCOL || protocol;
export const SERVER_URL = `${PROTOCOL}://${HOST}:${PORT}`;
