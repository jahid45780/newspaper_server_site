const express = require ('express');
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
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
    // await client.connect();

    const trNewsCollection = client.db('newsPaperDB').collection('trending')
    const allNewsCollection = client.db('newsPaperDB').collection('allNews')
    const usersCollection = client.db('newsPaperDB').collection('users')

     //  jwt related api
  app.post('/jwt', async (req, res)=>{
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'4h'})
    res.send({token})

})


     //  middleware
  const verifyToken = (req, res, next)=>{
    console.log( 'inside verify Token ', req.headers.authorization);
    if(!req.headers.authorization){
       return res.status(401).sent({message: 'unauthorized access'})
    }
    const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
          if(err){
              return res.status(401).send({message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next()
      })  
    
  }

  // verifyAdmin
  const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const isAdmin = user?. role === 'admin';
      if(!isAdmin){
         return res.status(403).send({message: 'forbidden access'})
      }
      next()
  }
    
    // user related api

  app.get('/users', verifyToken, verifyAdmin, async (req, res)=>{
       const result = await usersCollection.find().toArray();
       res.send(result);
  })


  app.get('/users/admin/:email', verifyToken, async (req, res) =>{
        const email = req.params.email;
        if(email !== req.decoded.email ) {
            return res.status(403).send({message: 'forbidden access'})
        }
        const query = {email: email};
        const user = await usersCollection.findOne(query)
        let admin = false;
        if(user){
           admin = user?.role === 'admin'
        }
        res.send({admin})
  })


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
    
   app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res)=>{
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const result = await usersCollection.deleteOne(query)
       res.send(result)
   })


   app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res)=>{
         const id = req.params.id;
         const filter = {_id: new ObjectId(id)}
         const updatedDoc = {
             $set :{
                role: 'admin'
             }
         } 

         const result = await usersCollection.updateOne(filter, updatedDoc)
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
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
