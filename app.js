import express from 'express';
import cors from 'cors';
import userRouter from './Routes/userRouter.js';
import transactionRouter from './Routes/transactionRouter.js';
import telegramRouter from "./Routes/telegramRouter.js"
import gameserviceRoutes from './Routes/ABCD/gameservice.js';
import publicRoutes from './Routes/ABCD/public.js';
import listRouter from './Routes/ABCD/list.js';
import spinRouter from './Routes/spinRouter.js';
import { bot } from "./bot/bot.js";


const app = express();


app.use((req, res, next) => {
  // Allow PNA (Chrome) when front-end calls a private IP like 10.x.x.x
  if (
    req.method === 'OPTIONS' &&
    req.headers['access-control-request-private-network'] === 'true'
  ) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      // Accept no-origin (mobile apps/postman) and any web origin for now
      if (!origin) return cb(null, true);
      return cb(null, true); // echo back any origin (dev friendly)
    },
    credentials: true, // only set true if you really need cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-telegram-init-data'
    ],
    exposedHeaders: ['Content-Length'],
  })
);

// Make sure OPTIONS is handled quickly
app.options('*', cors());

app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf?.toString("utf8") || "";
  }
}));

app.use(express.json());
app.use('/api', userRouter);
app.use('/api', transactionRouter);
app.use('/api', telegramRouter);
app.use("/gameservice", gameserviceRoutes);
app.use("/api", publicRoutes);
app.use("/api", listRouter);
app.use("/api", spinRouter)






export default app;