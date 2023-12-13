import express from "express";
import User from "./Models/User.js"; // Adjust the path based on your directory structure
import bcrypt from "bcrypt";
import crypto from "crypto"; // Import the 'crypto' module
import jwt from "jsonwebtoken"; // Import the jsonwebtoken library
import nodemailer from "nodemailer";
const app = express();
const port = process.env.PORT || 8000; // Use process.env.PORT for flexibility
import cors from "cors";
const SECRET = process.env.SECRET || "topsecret";
import cookieParser from "cookie-parser";
import multer from "multer";
import bucket from "./Bucket/Firebase.js";
import fs from "fs";
import path from "path";
import { tweetModel2 } from "./Models/User.js";
import { tweetModel } from "./Models/User.js";
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.options('*', cors());

const storage = multer.diskStorage({
  destination: "/tmp",
  filename: function (req, file, cb) {
    console.log("mul-file: ", file);
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
app.use(express.json());
app.get("/api/v1/paginatpost", async (req, res) => {
  try {
    let query = tweetModel.find();

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await tweetModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});
app.get("/api/v1/products2", async (req, res) => {
  try {
    const result = await tweetModel2.find().exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.get("/api/v1/products", async (req, res) => {
  try {
    const result = await tweetModel.find().exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.post('/api/v1/updates/:id', upload.any(), async (req, res) => {
  try {
    const body = req.body;
    const id = req.params.id;
    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    const uploadedFiles = req.files.map((file) => {
      console.log("uploaded file name: ", file.originalname);
      console.log("file type: ", file.mimetype);
      console.log("file name in server folders: ", file.filename);
      console.log("file path in server folders: ", file.path);

      return new Promise((resolve, reject) => {
        bucket.upload(
          file.path,
          {
            destination: `tweetPictures/${file.filename}`,
          },
          (err, gcsFile) => {
            if (!err) {
              gcsFile
                .getSignedUrl({
                  action: "read",
                  expires: "03-09-2999",
                })
                .then((urlData) => {
                  console.log("public downloadable url: ", urlData[0]);
                  fs.unlinkSync(file.path); // Delete the local file

                  resolve(urlData[0]);
                })
                .catch((err) => {
                  console.error("Error getting signed URL:", err);
                  reject(err);
                });
            } else {
              console.error("Error uploading to GCS:", err);
              reject(err);
            }
          }
        );
      });
    });

    Promise.all(uploadedFiles)
      .then((urls) => {
        let array = urls
        tweetModel.findByIdAndUpdate(id, {
          projectName: body.projectName,
          projectCategory :    body.projectCategory,
          amountRequired: body.amountRequired,
          collectedAmount: body.collectedAmount,
          projectDescription: body.projectDescription,
          imageUrl: array,
        }, { new: true })
          .then(updatedProduct => {
            console.log("Product Updated successfully", updatedProduct);
            res.status(200).send();
          })
          .catch(error => {
            console.error("Error updating product:", error);
            res.status(500).send();
          });
        })
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send();
  }  


});
app.post('/api/v1/updated/completed/:id', upload.any(), async (req, res) => {
  try {
    const body = req.body;
    const id = req.params.id;
    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    const uploadedFiles = req.files.map((file) => {
      console.log("uploaded file name: ", file.originalname);
      console.log("file type: ", file.mimetype);
      console.log("file name in server folders: ", file.filename);
      console.log("file path in server folders: ", file.path);

      return new Promise((resolve, reject) => {
        bucket.upload(
          file.path,
          {
            destination: `tweetPictures/${file.filename}`,
          },
          (err, gcsFile) => {
            if (!err) {
              gcsFile
                .getSignedUrl({
                  action: "read",
                  expires: "03-09-2999",
                })
                .then((urlData) => {
                  console.log("public downloadable url: ", urlData[0]);
                  fs.unlinkSync(file.path); // Delete the local file

                  resolve(urlData[0]);
                })
                .catch((err) => {
                  console.error("Error getting signed URL:", err);
                  reject(err);
                });
            } else {
              console.error("Error uploading to GCS:", err);
              reject(err);
            }
          }
        );
      });
    });

    Promise.all(uploadedFiles)
      .then((urls) => {
        let array = urls
        tweetModel2.findByIdAndUpdate(id, {
          projectName: body.projectName,
          projectCategory : body.projectCategory,
          amountRequired: body.amountRequired,
          collectedAmount: body.collectedAmount,
          projectDescription: body.projectDescription,
          imageUrl: array,
        }, { new: true })
          .then(updatedProduct => {
            console.log("Product Updated successfully", updatedProduct);
            res.status(200).send();
          })
          .catch(error => {
            console.error("Error updating product:", error);
            res.status(500).send();
          });
        })
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send();
  }  


});
app.get("/api/v1/AllUser", async (req, res) => {
  try {
    const result1 = await User.find().exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all users successfully",
      data: result1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.get("/api/v1/selectuserproducts", async (req, res) => {
  try {
    const emailid = req.params.email;

    const existingUser = await tweetModel.findOne({ email: emailid });

    res.send({
      message: "Got user products successfully",
      data: existingUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.delete("/api/v1/customer/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await tweetModel.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "Product has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No Product found with this id: " + id,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.delete("/api/v1/customer2/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await tweetModel2.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "Product has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No Product found with this id: " + id,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.post("/api/v1/AddProduct", upload.any(), (req, res) => {
  try {
    const body = req.body;
    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    const uploadedFiles = req.files.map((file) => {
      console.log("uploaded file name: ", file.originalname);
      console.log("file type: ", file.mimetype);
      console.log("file name in server folders: ", file.filename);
      console.log("file path in server folders: ", file.path);

      return new Promise((resolve, reject) => {
        bucket.upload(
          file.path,
          {
            destination: `tweetPictures/${file.filename}`,
          },
          (err, gcsFile) => {
            if (!err) {
              gcsFile
                .getSignedUrl({
                  action: "read",
                  expires: "03-09-2999",
                })
                .then((urlData) => {
                  console.log("public downloadable url: ", urlData[0]);
                  fs.unlinkSync(file.path); // Delete the local file

                  resolve(urlData[0]);
                })
                .catch((err) => {
                  console.error("Error getting signed URL:", err);
                  reject(err);
                });
            } else {
              console.error("Error uploading to GCS:", err);
              reject(err);
            }
          }
        );
      });
    });

    Promise.all(uploadedFiles)
      .then((urls) => {
        let array = urls
        let addProduct = new tweetModel({
          projectName: body.projectName,
          projectCategory :    body.projectCategory,
          amountRequired: body.amountRequired,
          collectedAmount: body.collectedAmount,
          projectDescription: body.projectDescription,
          imageUrl: array,
        });

        return addProduct.save();
      })
      .then(() => {
        console.log("Product added successfully");
        res.status(200).send();
      })
      .catch((error) => {
        console.error("Error adding product:", error);
        res.status(500).send();
      });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send();
  }
});
app.post("/api/v1/CompletedProject/:id", upload.any(), async (req, res) => {
  const id = req.params.id;

  try {
    // Assuming tweetModel has a method like findById to find a document by its ID
    const tweet = await tweetModel.findById(id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    // Create a new instance of tweetModel2 with data from tweet
    let addProduct = new tweetModel2({
      projectName: tweet.projectName,
      projectCategory :    tweet.projectCategory,
      amountRequired: tweet.amountRequired,
      collectedAmount: tweet.collectedAmount,
      projectDescription: tweet.projectDescription,
      imageUrl: tweet.imageUrl,
    });

    // Save the new instance to the database
    addProduct.save().then(async (savedProduct) => {
      console.log(savedProduct, "Product added");

      try {
        const deletedData = await tweetModel.deleteOne({ _id: id });

        if (deletedData.deletedCount !== 0) {
          res.status(200).json({
            message: "Product has been deleted successfully",
          });
        } else {
          res.status(404).json({
            message: "No Product found with this id: " + id,
          });
        }
      } catch (deleteError) {
        console.error("Error deleting product:", deleteError);
        res.status(500).json({ error: 'Error deleting product' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post("/api/v1/CompletedProject2/:id", upload.any(), async (req, res) => {
  const id = req.params.id;

  try {
    // Assuming tweetModel has a method like findById to find a document by its ID
    const tweet = await tweetModel2.findById(id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    // Create a new instance of tweetModel2 with data from tweet
    let addProduct = new tweetModel({
      projectName: tweet.projectName,
      projectCategory : tweet.projectCategory,
      amountRequired: tweet.amountRequired,
      collectedAmount: tweet.collectedAmount,
      projectDescription: tweet.projectDescription,
      imageUrl: tweet.imageUrl,
    });

    // Save the new instance to the database
    addProduct.save().then(async (savedProduct) => {
      console.log(savedProduct, "Product added");

      try {
        const deletedData = await tweetModel2.deleteOne({ _id: id });

        if (deletedData.deletedCount !== 0) {
          res.status(200).json({
            message: "Product has been deleted successfully",
          });
        } else {
          res.status(404).json({
            message: "No Product found with this id: " + id,
          });
        }
      } catch (deleteError) {
        console.error("Error deleting product:", deleteError);
        res.status(500).json({ error: 'Error deleting product' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// app.post("/signup", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Check if user with the given email already exists
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     // Create a new user
//     const newUser = new User({
//       username,
//       email,
//       password,
//     });

//     // Save the user to the database
//     await newUser.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
// app.post("/login", async (req, res) => {
//   try {
//     let body = req.body;
//     body.email = body.email.toLowerCase();

//     if (!body.email || !body.password) {
//       res.status(400).send(`required fields missing, request example: ...`);
//       return;
//     }

//     // check if user exists
//     const data = await User.findOne(
//       { email: body.email },
//       "username email password"
//     );

//     if (data && body.password === data.password) {
//       // user found
//       console.log("User Successfully Logged In !");
//       console.log("data: ", data);

//       const token = jwt.sign(
//         {
//           _id: data._id,
//           email: data.email,
//           iat: Math.floor(Date.now() / 1000) - 30,
//           exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
//         },
//         SECRET
//       );

//       console.log("token: ", token);

//       res.cookie("Token", token, {
//         maxAge: 86_400_000,
//         httpOnly: true,
//         sameSite: "none",
//         secure: true,
//       });

//       res.send({
//         message: "login successful",
//         profile: {
//           email: data.email,
//           firstName: data.firstName,
//           lastName: data.lastName,
//           age: data.age,
//           _id: data._id,
//         },
//       });

//       return;
//     } else {
//       // user not found
//       console.log("user not found");
//       res.status(401).send({ message: "Incorrect email or password" });
//     }
//   } catch (error) {
//     console.log("error: ", error);
//     res.status(500).send({ message: "login failed, please try later" });
//   }
// });
// app.use("/api/v1", (req, res, next) => {
//   console.log("req.cookies: ", req.cookies.Token);

//   if (!req?.cookies?.Token) {
//     res.status(401).send({
//       message: "include http-only credentials with every request",
//     });
//     return;
//   }

//   jwt.verify(req.cookies.Token, SECRET, function (err, decodedData) {
//     if (!err) {
//       console.log("decodedData: ", decodedData);

//       const nowDate = new Date().getTime() / 1000;

//       if (decodedData.exp < nowDate) {
//         res.status(401);
//         res.cookie("Token", "", {
//           maxAge: 1,
//           httpOnly: true,
//           sameSite: "none",
//           secure: true,
//         });
//         res.send({ message: "token expired" });
//       } else {
//         console.log("token approved");

//         req.body.token = decodedData;
//         next();
//       }
//     } else {
//       res.status(401).send("invalid token");
//     }
//   });
// });
// app.get("/api/v1/profile", (req, res) => {
//   const _id = req.body.token._id;
//   const getData = async () => {
//     try {
//       const user = await User.findOne(
//         { _id: _id },
//         "email password username -_id"
//       ).exec();
//       if (!user) {
//         res.status(404).send({});
//         return;
//       } else {
//         res.set({
//           "Cache-Control":
//             "no-store, no-cache, must-revalidate, proxy-revalidate",
//           Pragma: "no-cache",
//           Expires: "0",
//           "Surrogate-Control": "no-store",
//         });
//         res.status(200).send(user);
//       }
//     } catch (error) {
//       console.log("error: ", error);
//       res.status(500).send({
//         message: "something went wrong on server",
//       });
//     }
//   };
//   getData();
// });
// app.post("/logout", (req, res) => {
//   try {
//     //   res.clearCookie('Token', {
//     //     httpOnly: true,
//     //     samesite: "none",
//     //     secure: true
//     // });
//     // res.send({ message: "logged out successful" })

//     res.cookie("Token", "", {
//       maxAge: 0,
//       httpOnly: true,
//       sameSite: "none", // Change to 'strict' if not using HTTPS
//       secure: true, // Remove this line if not using HTTPS
//       path: "/", // Make sure the path matches the one used when setting the token cookie
//       domain: "http://localhost:3000/", // Make sure the domain matches the one used when setting the token cookie
//     });
//     res.send({ message: "Logged out successful" });
//   } catch (error) {
//     console.error("Error clearing cookie:", error);
//     res.status(500).send({ message: "Logout failed, please try later" });
//   }
// });
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
