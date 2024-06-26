import { faker, simpleFaker } from "@faker-js/faker";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";

const createSingleChats = async (numChats) => {
    try {
        const users = await User.find().select("_id");
        const chats = [];
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                chats.push(
                    Chat.create({
                        name: faker.lorem.words(2),
                        members: [users[i], users[j]],
                    })
                );
            }
        }

        await Promise.all(chats);
        console.log("Chats created", numChats);
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

const createGroupChats = async (numChats) => {
    try {
        const users = await User.find().select("_id");
        const chats = [];
        for (let i = 0; i < users.length; i++) {
            const numMembers = simpleFaker.number.int({
                mind: 3,
                max: users.length,
            });
            const members = [];

            for (let i = 0; i < numMembers; i++) {
                const randomIndex = Math.floor(Math.random() * users.length);
                const randomUser = users[randomIndex];

                if (!members.includes(randomUser)) {
                    members.push(randomUser);
                }
            }
            const chat = Chat.create({
                name: faker.lorem.words(1),
                groupChat: true,
                members,
                creator: members[0],
            });

            chats.push(chat);
        }
        await Promise.all(chats);
        console.log("Chats created", numChats);
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

const createMessages = async (numMessages) => {
    try {
        const users = await User.find().select("_id");
        const chats = await Chat.find().select("_id");

        const messages = [];
        for (let i = 0; i < numMessages; i++) {
            const randomChat = chats[Math.floor(Math.random() * chats.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];

            messages.push(
                Message.create({
                    chat: randomChat,
                    sender: randomUser,
                    content: faker.lorem.sentence(10),
                })
            );
        }

        await Promise.all(messages);
        console.log("Messages created", numMessages);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const createMessagesInAChat = async (chatId, numMessages) => {
    try {
        const users = await User.find().select("_id");
        const messages = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];

            messages.push(
                Message.create({
                    chat: chatId,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messages);
        console.log("Messages created", numMessages);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

export {
    createGroupChats,
    createMessagesInAChat,
    createMessages,
    createSingleChats,
};
