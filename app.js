import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { v4 as uuid } from "uuid";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { corsOptions } from "./constants/config.js";

dotenv.config({
    path: "./.env",
});
const port = process.env.PORT || 3000;
const envMode = "DEVELOPMENT";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";

connectDB();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

app.set("io", io);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Routes
import { userRoute, chatRoute, adminRoute } from "./routes/index.js";
import { Message } from "./models/message.js";
import {
    CHAT_JOINED,
    CHAT_LEAVED,
    NEW_MESSAGE,
    NEW_MESSAGE_ALERT,
    ONLINE_USERS,
    START_TYPING,
    STOP_TYPING,
} from "./constants/events.js";

app.get("/", (req, res) => {
    res.send("Hello World");
});
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

// Socket Functioning
import { getSockets } from "./lib/helper.js";
import { socketAuthenticator } from "./middlewares/auth.js";
const userSocketIDs = new Map(); // currently active users
const onlineUsers = new Set();

io.use((socket, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async (err) => await socketAuthenticator(err, socket, next)
    );
});

io.on("connection", (socket) => {
    const user = socket.user;
    userSocketIDs.set(user._id.toString(), socket.id); // maping currently active users with their respective socket ids.

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user._id,
                name: user.name,
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
        };
        const messageForDB = {
            content: message,
            sender: user._id,
            chat: chatId,
        };

        // members => all members of the chat, to which the sender is sending the messages.
        const membersSockets = getSockets(members); // membersSockets => socket id of all the members of this chat to which this message is required to send - receivers
        io.to(membersSockets).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
        });
        io.to(membersSockets).emit(NEW_MESSAGE_ALERT, { chatId });

        try {
            await Message.create(messageForDB);
        } catch (error) {
            throw new Error(error);
        }
    });

    socket.on(START_TYPING, ({ members, chatId }) => {
        const membersSockets = getSockets(members);
        socket.to(membersSockets).emit(START_TYPING, { chatId });
    });

    socket.on(STOP_TYPING, ({ members, chatId }) => {
        const membersSockets = getSockets(members);
        socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    });

    socket.on(CHAT_JOINED, ({ userId, members }) => {
        onlineUsers.add(userId.toString());

        const membersSockets = getSockets(members);
        io.to(membersSockets).emit(ONLINE_USERS, Array.from(onlineUsers));
    });

    socket.on(CHAT_LEAVED, ({ userId, members }) => {
        onlineUsers.delete(userId.toString());

        const membersSockets = getSockets(members);
        io.to(membersSockets).emit(ONLINE_USERS, Array.from(onlineUsers));
    });

    socket.on("disconnect", () => {
        userSocketIDs.delete(user._id.toString());
        onlineUsers.delete(user._id.toString());
        socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    });
});

app.use(errorMiddleware);

server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export { envMode, adminSecretKey, userSocketIDs };
