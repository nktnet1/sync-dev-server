import express, { json, Request, Response } from 'express';
import morgan from 'morgan';

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
