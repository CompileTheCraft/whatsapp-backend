import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import Cors from 'cors';

// App config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1243473",
  key: "49df0990d70f4a97d2f8",
  secret: "780fe85076bc92b92ca2",
  cluster: "mt1",
  useTLS: true
});

// Middlewares
app.use(express.json());
app.use(Cors());

// Db config
const dbPassword = "gxppt03pGAWP8OUs";
const dbName = "whatsappDB";
const connectionURL = `mongodb+srv://admin:${dbPassword}@cluster0.qxaur.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(connectionURL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Pusher
const db = mongoose.connection;

db.once('open', () => {
  console.log(`Db connected. Name of DB: ${dbName}`);

  const msgCollector = db.collection("messagecontents");
  const changeStream = msgCollector.watch();

  changeStream.on('change', (change) => {
    console.log(change);

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messsages', 'inserted',
        {
          name: messageDetails.name,
          message: messageDetails.message,
          timestamp: messageDetails.timestamp,
          received: messageDetails.received
        }
      );
    } else {
      console.log("Error triggering Pusher!");
    }
  });
});

// api routes
app.get('/', (req, res) => res.status(200).send("The Server is Up!"));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listener
app.listen(port, () => console.log(`Listening on localhost:${port}`));