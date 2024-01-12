const express = require ('express');
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d6oiejw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const trNewsCollection = client.db('newsPaperDB').collection('trending')
    const allNewsCollection = client.db('newsPaperDB').collection('allNews')
    const usersCollection = client.db('newsPaperDB').collection('users')
    
    // user related api
   app.post('/users', async (req, res)=>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await usersCollection.findOne(query)
        if(existingUser){
           return res.send({message: 'user already existed', insertedId: null})
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
   })


    // trending
    app.get('/trending', async (req, res)=>{

      const result = await  trNewsCollection.find().toArray()
      res.send(result)
       
   })

  //  All news

  app.get('/allNews', async (req, res)=>{
    const cursor = allNewsCollection.find();
    const result = await cursor.toArray();
    res.send(result) 
 })

//  const filter = res.query;
//  console.log(filter);
//  const query = {
//    news_title: {$regex: filter.search}      
//  }

  // news Detail
  app.get('/allNews/:id', async (req, res) =>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const result = await allNewsCollection.findOne(query)
      res.send(result)
  })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
     res.send('newspaper is running')
})

app.listen(port, ()=>{
 console.log(`newspaper is running port ${port} `);
})
