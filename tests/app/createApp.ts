import express, { json, Request, Response } from 'express';
import morgan from 'morgan';

/**
 * Create a basic server application with some default middlewares
 *
 * @param name Name of the server app to create
 * @returns the server app
 */
const createApp = (name: string) => {
  const app = express();
  app.use(json());
  app.use(morgan('dev'));
  app.get('/', (_: Request, res: Response) => {
    res.json({ message: `Welcome to ${name}!` });
  });
  return app;
};

export default createApp;
