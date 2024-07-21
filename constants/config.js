const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://gupshup-client.vercel.app",
        process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

const GUPSHUP_TOKEN = "gupshup-token";

export { GUPSHUP_TOKEN, corsOptions };
