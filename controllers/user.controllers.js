import { User } from "../models/user.js";
import { compare } from "bcrypt";
import {
    cookieOptions,
    sendToken,
    emitEvent,
    uploadFilesToCloudinary,
} from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";

// Create a new user and save it to the database and save in cookie.
const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    const file = req.file;
    if (!file) return next(new ErrorHandler("Please Upload Avatar"));

    const result = await uploadFilesToCloudinary([file]);

    const avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
    };

    const user = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    });

    sendToken(res, user, 201, "User created");
});

/*
1st option
const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    // var bio = req.body.bio || "Hey, There I am using Gupshup";
    const file = req.file;

    console.log("File To Hai");

    const result = null;
    if (file) {
        console.log("File To Hai2");
        result = await uploadFilesToCloudinary([file]);
        console.log("File Handle Nahi Hui");
    }

    const avatar = {
        public_id: result ? result[0].public_id : "",
        url: result
            ? result[0].url
            : "https://www.w3schools.com/howto/img_avatar.png",
    };

    const user = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    });

    console.log("Bio", bio);
    sendToken(res, user, 201, "USER CREATED");
    // res.status(201).json({ message: "USER CREATED" });
});

2nd option
const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    const file = req.file;
    console.log(file);
    // const avatar = {};
    // if (!file) return next(new ErrorHandler("Please Upload Avatar"));
    // if (file) {
    //     const result = await uploadFilesToCloudinary([file]);

    //     avatar = {
    //         public_id: result[0].public_id,
    //         url: result[0].url,
    //     };
    // }

    const avatar = {
        // public_id: "test",
        // url: "",
    };

    const user = await User.create({
        name,
        bio,
        username,
        password,
        avatar,
    });

    // const avatar = {};
    // const user = await User.create({
    //     name: "test7",
    //     bio: "test7",
    //     username: "test7",
    //     password: "password",
    //     avatar,
    // });

    sendToken(res, user, 201, "USER CREATED");
    // res.status(201).json({ message: "USER CREATED" });
});
*/

const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select("+password");
    if (!user) return next(new ErrorHandler("Invalid Username", 404));
    const isMatch = await compare(password, user.password);
    if (!isMatch)
        return next(new ErrorHandler("Invalid Username or Password", 404));
    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
});

const getMyProfile = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.user);
    if (!user) return next(new ErrorHandler("User not found", 404));
    res.status(200).json({
        success: true,
        user,
    });
});

const logout = TryCatch(async (req, res) => {
    return res
        .status(200)
        .cookie("gupshup-token", "", { ...cookieOptions, maxAge: 0 })
        .json({
            success: true,
            message: "Logged out successfully",
        });
});

const searchUser = TryCatch(async (req, res) => {
    const { name = "" } = req.query;
    // Finding All my chats
    const myChats = await Chat.find({ groupChat: false, members: req.user });
    //  extracting All Users from my chats means friends or people I have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);
    // Finding all users except me and my friends
    const allUsersExceptMeAndFriends = await User.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    });
    // Modifying the response
    const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar?.url, // --->>>
    }));
    return res.status(200).json({
        success: true,
        users,
    });
});

const sendFriendRequest = TryCatch(async (req, res, next) => {
    const { userId } = req.body;

    if (userId === req.user)
        return next(
            new ErrorHandler("You can't send request to yourself", 400)
        );

    const request = await Request.findOne({
        $or: [
            { sender: req.user, receiver: userId },
            { sender: userId, receiver: req.user },
        ],
    });

    if (request) return next(new ErrorHandler("Request already sent", 400));
    await Request.create({
        sender: req.user,
        receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId]);
    return res.status(200).json({
        success: true,
        message: "Friend Request Sent",
    });
});

const acceptFriendRequest = TryCatch(async (req, res, next) => {
    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId)
        .populate("sender", "name")
        .populate("receiver", "name");

    if (!request) return next(new ErrorHandler("Request not found", 404));
    if (request.receiver._id.toString() !== req.user.toString())
        return next(
            new ErrorHandler(
                "You are not authorized to accept this request",
                401
            )
        );
    if (!accept) {
        await request.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected",
        });
    }

    const members = [request.sender._id, request.receiver._id];
    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ]);
    emitEvent(req, REFETCH_CHATS, members);
    return res.status(200).json({
        success: true,
        message: "Friend Request Accepted",
        senderId: request.sender._id,
    });
});

const getMyNotifications = TryCatch(async (req, res) => {
    const requests = await Request.find({ receiver: req.user }).populate(
        "sender",
        "name avatar"
    );

    const allRequests = requests.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar?.url,
        },
    }));
    return res.status(200).json({
        success: true,
        allRequests,
    });
});

const getMyFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId;
    const chats = await Chat.find({
        members: req.user,
        groupChat: false,
    }).populate("members", "name avatar");
    const friends = chats.map(({ members }) => {
        const otherUser = getOtherMember(members, req.user);
        if (otherUser) {
            return {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar?.url,
            };
        }
    });
    if (chatId) {
        const chat = await Chat.findById(chatId);
        // availableFriends = i.e. the one which are not in the chat and we can add them.
        const availableFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        );
        return res.status(200).json({
            success: true,
            friends: availableFriends,
        });
    } else {
        return res.status(200).json({
            success: true,
            friends,
        });
    }
});

export {
    newUser,
    login,
    logout,
    getMyProfile,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    getMyNotifications,
    getMyFriends,
};
