import mongoose from "mongoose";
import express, { json } from "express";

import cors from "cors";

try {
    await mongoose.connect("mongodb://127.0.0.1:27017/FinalProjectPrototype");
  } catch (err) {
    console.log("Connection to DB refused");
    console.error(err);
    // gracefull shutdown
    process.on("SIGINT", async () => {
      await mongoose.disconnect();
      process.exit();
    });
  }

// Определение схемы-родителя
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  }, 
  middleName: {
    type: String,
    required: false
  },
  citizenship: { 
    type: String, 
    enum: ["Kazakstan", "Kyrgyzstan", "Russia", "USA"],
    required: false 
  },
  IIN: {
    type: String,
    required: false,
    min: 12, 
    max: 12,
    unique: true
  },
  passportNumber: {
    type: String,
    required: false
  },
});

// Постоялец
const OaspeteSchema = UserSchema.discriminator('Oaspete', new mongoose.Schema({
    reviewsCount: {
    type: Number,
    required: true,
    default: 0
  },
  ratingValue: {
    type: Number,
    required: true,
    default: 0.00
  }
}));

// Рецензент
const ReviewerSchema = UserSchema.discriminator('Reviewer', new mongoose.Schema({
    companyName: {
        type: String,
        required: false
    },
    reviewerType: {
        type: String,
        enum: ["representative", "owner"],
        default: "representative",
        required: true
  }
}));

const ReviewSchema = mongoose.Schema({
    reviewDate: {
        type: Date,
        default: Date.now
    },
    oaspet: { type: mongoose.Schema.Types.ObjectId, ref: "OaspeteSchema" },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "ReviewerSchema" },
    reviewText: {
        type: String,
        required: false
    },
    ratingValue: {
        type: Number,
        required: true
    }
});
  
// Создание модели на основе схемы-родителя
const UserModel = mongoose.model('User', UserSchema);

// Создание объектов моделей-дочерних
const OaspeteModel = mongoose.model('Oaspete');
const ReviewerModel = mongoose.model('Reviewer');

const ReviewModel = mongoose.model('Review', ReviewSchema);

/*
let newOaspete = await new OaspeteModel({
    "username": "MuratovAlina",
    "password": "qwerty3",
    "firstName": "Alina",
    "lastName": "Muratova",
    "citizenship": "Kazakstan",
    "IIN": "777777777777",
    "reviewsCount": 0,
    "ratingValue": 0
});
await newOaspete.save();

newOaspete = await new OaspeteModel({
  "username": "serik",
  "password": "qwerty1",
  "firstName": "Serik",
  "lastName": "Serikov",
  "citizenship": "Kazakstan",
  "IIN": "111111111111",
  "reviewsCount": 0,
  "ratingValue": 0
});
await newOaspete.save();

newOaspete = await new OaspeteModel({
  "username": "seliverstova",
  "password": "qwerty2",
  "firstName": "Seliverstova",
  "lastName": "Anna",
  "middleName": "Stalonievna",
  "citizenship": "USA",
  "passportNumber": "222222222222",
  "reviewsCount": 0,
  "AverageRatingValue": 0
});
await newOaspete.save();

let newReviewer = await new ReviewerModel({
    "username": "zhanna",
    "password": "qwerty8",
    "firstName": "Zhanna",
    "lastName": "Turarova",
    "middleName": "Amangelievna",
    "citizenship": "Kazakstan",
    "passportNumber": "888888888888",
    "reviewerType": "owner"
});
await newReviewer.save();

newReviewer = await new ReviewerModel(	{
  "username": "Alibek",
  "password": "qwerty5",
  "firstName": "ALibek",
  "lastName": "Alibekov",
  "citizenship": "Kazakstan",
  "IIN": "5555555555555",
  "companyName": "Roayl Petrol Hotel",
  "reviewerType": "representative"
});
await newReviewer.save();

let newReview = await new ReviewModel({
    "oaspet": "6497667d5e8c7954773d9a3f",
    "reviewer": "649768005e8c7954773d9a43",
    "reviewText": "Очень добропорядочный клиент!",
    "ratingValue": 5
});
await newReview.save();
*/

const app = express();

app.use(express.json());
app.use(cors);

app.get("/oaspetes/", async (req, res) => {
  const allOaspetes = await OaspeteModel.find();
  res.send(allOaspetes);
});

app.get("/oaspetes/:id", async (req, res) => {
  const oaspeteID = req.params.id;

  const oaspeteObjecById = await OaspeteModel.findOne(
    {
      _id: new mongoose.Types.ObjectId(oaspeteID)
    }
  );
  res.status(200).json(oaspeteObjecById);
}); 

app.get("/reviews/byOaspete/:oaspete", async (req, res) => {
  const oaspeteID = req.params.oaspete;

  const reviewsByOaspete = await ReviewModel.find(
    {
      oaspet: new mongoose.Types.ObjectId(oaspeteID)
    }
  );
  res.status(200).send(reviewsByOaspete);
});

app.get("/reviews/byReviewer/:reviewer", async (req, res) => {
  const reviewerID = req.params.reviewer;

  const reviewsByReviewer = await ReviewModel.find(
    {
      reviewer: new mongoose.Types.ObjectId(reviewerID)
    }
  );
  res.status(200).send(reviewsByReviewer);
});

app.post("/reviews/add", async (req, res)=> {
  const item = req.body;
  if (item.reviewText && item.ratingValue) {
    item.oaspet = '6497667d5e8c7954773d9a3f';
    item.reviewer = '649768005e8c7954773d9a43';
      
    const response = await ReviewModel.create(item);
    item["_id"] = response.insertedId;
    res.status(201).send(item);
  }
})

app.listen(9000, () => {
  console.log("app is listening on port 9000");
});
