const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
const allowedOrigins = [
    "https://student-progress-tracking-nine.vercel.app",
    "https://student-progress-tracking.onrender.com",
    "https://student-progress-track.vercel.app",
    "https://student-progress-tracking-git-main-tamizhakarans-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow if no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) || 
                         (origin.includes("student-progress-tracking") && origin.endsWith(".vercel.app"));

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(helmet({
    crossOriginResourcePolicy: false,
}));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/study-materials', require('./routes/studyMaterialRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/placements', require('./routes/placementRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Fallback for frontend routes that mistakenly hit the backend directly
// (e.g. if an email link incorrectly points to the backend URL)
app.get(['/reset-password/:token', '/forgot-password', '/login'], (req, res) => {
    let frontendUrl = process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('onrender.com') 
        ? process.env.FRONTEND_URL 
        : "https://student-progress-tracking-nine.vercel.app";
        
    frontendUrl = frontendUrl.replace(/\/$/, '');
        
    res.redirect(`${frontendUrl}${req.path}`);
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

module.exports = app;

