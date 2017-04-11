import * as express from 'express';
export function notAllowed(req: express.Request, res: express.Response) {
  res.sendStatus(404);
}