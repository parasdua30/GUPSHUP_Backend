import multer from "multer";

const multerUpload = multer({
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
});

const singleAvatar = multerUpload.single("avatar");
const attachmentsMulter = multerUpload.array("files", 5);
export { singleAvatar, attachmentsMulter };

// In Case :-
// import multer from "multer";
// // Set up multer with a limit of 5MB per file
// const multerUpload = multer({
//     limits: {
//         fileSize: 1024 * 1024 * 5, // 5MB limit
//     },
//     fileFilter: function (req, file, cb) {
//         // Add file type checks here if needed
//         cb(null, true);
//     },
// });

// // Middleware for single file upload under the field name "avatar"
// const singleAvatar = (req, res, next) => {
//     multerUpload.single("file")(req, res, function (error) {
//         // console.log(req.file); // Log the file object to see what is received
//         // console.log(req.body); // This will log non-file fields; might help in debugging
//         if (error instanceof multer.MulterError) {
//             // console.error("Multer error when uploading single avatar:", error);
//             return res
//                 .status(500)
//                 .send("Error uploading avatar: " + error.message);
//         } else if (error) {
//             // console.error("Unknown error when uploading single avatar:", error);
//             return res.status(500).send("Error uploading avatar.");
//         }
//         next();
//     });
// };

// // Middleware for multiple file uploads, up to 5 files, under the field name "files"
// const attachmentsMulter = (req, res, next) => {
//     multerUpload.array("files", 5)(req, res, function (error) {
//         if (error instanceof multer.MulterError) {
//             // A Multer error occurred when uploading.
//             // console.error("Multer error when uploading multiple files:", error);
//             return res
//                 .status(500)
//                 .send("Error uploading files: " + error.message);
//         } else if (error) {
//             // An unknown error occurred when uploading.
//             console.error(
//                 // "Unknown error when uploading multiple files:",
//                 error
//             );
//             return res.status(500).send("Error uploading files.");
//         }
//         // Everything went fine.
//         next();
//     });
// };

// // Export the middlewares
// export { singleAvatar, attachmentsMulter };

// /*  Old Code:

//     import multer from "multer";
//     const multerUpload = multer({
//     limits: {
//         fileSize: 1024 * 1024 * 5,
//     },
//     });
//     const singleAvatar = multerUpload.single("avatar");
//     const attachmentsMulter = multerUpload.array("files", 5);
//     export { singleAvatar, attachmentsMulter };
// */
