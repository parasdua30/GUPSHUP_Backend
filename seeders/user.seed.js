import { faker } from "@faker-js/faker";
import { User } from "../models/user.js";

const createUser = async (numUsers) => {
    try {
        const users = [];
        for (let i = 0; i < numUsers; i++) {
            const tempUser = User.create({
                name: faker.person.fullName(),
                username: faker.internet.userName(),
                bio: faker.lorem.sentence(10),
                password: "password",
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName(),
                },
            });
            users.push(tempUser);
        }
        await Promise.all(users);
        console.log("Users created", numUsers);
        process.exit(1);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

export { createUser };
