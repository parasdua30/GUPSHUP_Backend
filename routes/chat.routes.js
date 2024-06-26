import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
    getMyChats,
    newGroupChat,
    getMyGroups,
    addMembers,
    removeMember,
    leaveGroup,
    sendAttachments,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages,
} from "../controllers/chat.controllers.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import {
    addMemberValidator,
    chatIdValidator,
    newGroupValidator,
    removeMemberValidator,
    renameValidator,
    sendAttachmentsValidator,
    validateHandler,
} from "../lib/validators.js";

const app = express.Router();

// require user to be logged in to access these routes.
app.use(isAuthenticated);

app.post("/new", newGroupValidator(), validateHandler, newGroupChat);
app.get("/my", getMyChats);
app.get("/my/groups", getMyGroups);
app.put("/addmembers", addMemberValidator(), validateHandler, addMembers);
app.put(
    "/removemember",
    removeMemberValidator(),
    validateHandler,
    removeMember
);
app.delete("/leave/:id", chatIdValidator(), validateHandler, leaveGroup);

// Send Attachments
app.post(
    "/message",
    attachmentsMulter,
    sendAttachmentsValidator(),
    validateHandler,
    sendAttachments
);

// Get Messages
app.get("/message/:id", chatIdValidator(), validateHandler, getMessages);

// Get Chat Details, rename,delete
app.route("/:id")
    .get(chatIdValidator(), validateHandler, getChatDetails)
    .put(renameValidator(), validateHandler, renameGroup)
    .delete(chatIdValidator(), validateHandler, deleteChat);

export default app;
