const express = require('express')
const app = express()
const cors = require('cors')
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ConnectionCheckedInEvent, Admin } = require('mongodb');

//doctor-portal-firebase-adminsdk.json

//server port
const port = process.env.PORT || 5000



//const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//var serviceAccount = require("./doctor-portal-firebase-adminsdk.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

admin.initializeApp({
  credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID, // I get no error here
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // I get no error here
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // NOW THIS WORKS!!!
  }),
  //databaseURL: process.env.FIREBASE_DATABASE_URL
});


async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
  const token = req.headers.authorization.split(' ')[1];

  try{
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.decodedEmail = decodedUser.email;
  }
  catch{

  }
}
  next();
}

//middleware
app.use(cors());
app.use(express.json());


//server connect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c0wuh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const database = client.db('doctors_portal');
        const appointmentCollection = database.collection('appointments');
        const userCollection = database.collection('user');

        app.get('/appointments', verifyToken, async(req, res)=>{
          const email = req.query.email;
          const date = new Date(req.query.date).toLocaleDateString();
          const query = {email: email, date: date}
          const cursor =  appointmentCollection.find(query);
          const appointments = await cursor.toArray();
          res.json(appointments);
        })

        app.post('/appointments', async (req, res)=>{
          const appointment = req.body;
          const result = await appointmentCollection.insertOne(appointment);
          console.log(result);
          res.json(result);
        })

        app.get('/users/:email', async(req, res)=>{
          const email = req.params.email;
          const query = {email: email}
          const user  = await userCollection.findOne(query)
          let isAdmin = false
          if(user?.role === 'Admin'){
            isAdmin = true;
          }
          res.json({Admin: isAdmin})
        })

        app.post('/users', async(req, res)=>{
          const user = req.body;
          const result = await userCollection.insertOne(user)
          res.send(result);
        })

        app.put('/users', async(req, res)=>{
          const user = req.body;
          const filter = {email: user.email}
          const options = {upsert: true}
          const updateDocuments = {$set: user}
          const result = await userCollection.updateOne(filter, updateDocuments, options )
          console.log(result)
          res.json(result)
        })
        app.put('/users/admin', verifyToken, async(req, res)=>{
          const user = req.body;
          const requester = req.decodedEmail;
          if(requester){
            const requesterAccount = await userCollection.findOne({email: requester});
            if(requesterAccount.role === 'Admin'){
              const filter = {email: user.email}
              const updateDocuments = {$set: {role: "Admin"}}
              const result = await userCollection.updateOne(filter, updateDocuments)
              res.json(result)

            }
          }
          else{
            res.status(403).json({message:'You do not have make an admin user' })
          }



        })
    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello Doctors!')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})