const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');  /**token related import */
const cookieParser = require('cookie-parser'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

const app = express();

// middleware
const corsOptions = {
  origin: [
    'http://localhost:5173'    
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());


// console.log(process.env.DU_USER)
// console.log(process.env.DU_PASS)

const uri = `mongodb+srv://${process.env.DU_USER}:${process.env.DU_PASS}@cluster0.m0qpfuk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


    // Data collection
    const bookCollection = client.db('schoolLibrary').collection('books');
    const borrowedCollection = client.db('schoolLibrary').collection('borroweds');
    // const bidsBookCollection = client.db('schoolLibrary').collection('my-bids');

    // auth related api
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,  
      })
      .send({success: true})
    })





// books related api
    app.get('/book', async(req, res) =>{
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // book relased api
    app.get('/book/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
       const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { book: 1, author: 1, book_id: 1, image: 1, category: 1, rating: 1, description: 1, quantity: 1},
    };

      const result = await bookCollection.findOne(query, options);
      res.send(result);
    })

    // borrowed book
    app.get('/borroweds', async(req, res) => {
      console.log(req.query.email);
      console.log('tok tok toknen', req.cookies.token)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result =await borrowedCollection.find(query).toArray();
      res.send(result);
    })

    // return borrowed book
    app.delete('/borroweds/:id', async(req, res) => {
      const id = req.params.id;
      let query = {_id: new ObjectId(id)};
      const result =await borrowedCollection.deleteOne(query);
      res.send(result);
    })


    app.post('/borroweds', async(req, res) => {
      const borrowed = req.body;
      console.log(borrowed);
      const result = await borrowedCollection.insertOne(borrowed);
      res.send(result);
    })
    // save a book data in DB
    app.post('/book', async(req, res) => {
      const bookData = req.body;
      const result = await bookCollection.insertOne(bookData)
      res.send(result);
    })


    // get all books posted by a specific user => simple way => ok
    app.get('/books', async(req, res) => {
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result =await bookCollection.find(query).toArray();
      res.send(result);
    })
    // delete books = ok
    app.delete('/books/:id', async(req, res) => {
      const id = req.params.id;
      let query = {_id: new ObjectId(id)};
      const result =await bookCollection.deleteOne(query);
      res.send(result);
    })

    // update a book 
    app.put('/books/:id', async(req, res) =>{
      const id = req.params.id;
      const bookData = req.body;
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updateDoc = {
        $set: {
          ...bookData,
        }
      }
      const result = await bookCollection.updateOne(query, updateDoc, options)
      res.send(result);
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



app.get('/', (req, res) => {
    res.send('Hello from Public Library Scientia Server...')
})

app.listen(port, () => {
    console.log(`Books Server is running on port ${port}`)
})
