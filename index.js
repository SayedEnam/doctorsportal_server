const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ConnectionCheckedInEvent } = require('mongodb');



//server port
const port = process.env.PORT || 5000

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

        app.get('/appointments', async(req, res)=>{
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