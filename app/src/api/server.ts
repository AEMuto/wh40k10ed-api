import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import apiRouter from './routes';

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// --- Middleware ---
// Basic security middleware
app.use(helmet());
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- Routes ---
// Mount the main API router
app.use('/api', apiRouter);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(
    `API Server is running in ${ENVIRONMENT} mode on http://localhost:${PORT}`
  );
});