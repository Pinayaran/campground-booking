const dotenv = require('dotenv');

//load env var
dotenv.config({ path: './config/config.env' });

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
    try {
        await connectDB();
        server = app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (err) {
        console.log(`Error: ${err.message}`);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});
