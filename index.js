const express = require("express");

// require --- body-parser and cors
const bodyParser = require("body-parser");
const cors = require("cors");

// require --- mongodb
const { MongoClient } = require("mongodb");

// require --- dotenv
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// connection --- mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s07ju.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const plansCollection = client.db("netflix").collection("plans");
  const subscribersCollection = client.db("netflix").collection("subscribers");

  //   console.log("database connected");

  app.get("/loadPlans", (req, res) => {
    plansCollection.find().toArray((err, plans) => {
      res.send(plans);
    });
  });

  app.get("/loadSinglePlan/:id", (req, res) => {
    plansCollection.find({ id: req.params.id }).toArray((err, product) => {
      res.send(product);
    });
  });

  app.get("/loadSubscriptions/:email", (req, res) => {
    subscribersCollection
      .find({ email: req.params.email })
      .toArray((err, subscriptions) => {
        res.send(subscriptions);
      });
  });

  app.post("/insertSubscription", (req, res) => {
    const subscriberData = req.body;
    const subscriptionDetails = subscriberData.subscriptionDetails[0];

    subscribersCollection
      .find({ email: subscriberData.email })
      .toArray((err, subscriberDataMongo) => {
        if (subscriberDataMongo.length) {
          console.log(subscriberDataMongo.length);
          subscribersCollection
            .updateOne(
              { email: subscriberData.email },
              {
                $push: {
                  subscriptionDetails: {
                    planId: subscriptionDetails.planId,
                    planRole: subscriptionDetails.planRole,
                    orderTime: subscriptionDetails.orderTime,
                    renewTime: subscriptionDetails.renewTime,
                    paymentId: subscriptionDetails.paymentId,
                  },
                },
              }
            )
            .then((result) => {
              res.send(result.modifiedCount > 0);
            });
        } else {
          subscribersCollection.insertOne(subscriberData).then((result) => {
            res.send(result.acknowledged); // cause --- result.insertedCount not found
          });
        }
      });
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
