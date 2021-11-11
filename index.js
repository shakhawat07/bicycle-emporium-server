const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vbla2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('Database connected');
        const database = client.db('bicycleEmporium');
        const bicyclesCollection = database.collection('bicycles');

        const usersCollection = database.collection('users');
        const teamMembersCollection = database.collection('teamMembers');
        // const bicycleCategoriesCollection = database.collection('bicycleCategories');
        const ordersCollection = database.collection('orders');


        // GET API OF USERS
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });


        // app.get('/users/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     let isAdmin = false;
        //     if (user?.role === 'admin') {
        //         isAdmin = true;
        //     }
        //     res.json({ admin: isAdmin });
        // })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(req.body);
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // GET API OF BICYCLES
        app.get('/bicycles', async (req, res) => {
            const cursor = bicyclesCollection.find({});
            const bicycles = await cursor.toArray();
            res.send(bicycles);
        });

        // GET SINGLE BICYCLE
        app.get('/bicycles/:id', async (req, res) => {
            const id = req.params.id;
            console.log('Getting specific bicycle', id);
            const query = { _id: ObjectId(id) };
            const bicycle = await bicyclesCollection.findOne(query);
            res.json(bicycle);
        });

        // GET API OF TEAM MEMBERS
        app.get('/teamMembers', async (req, res) => {
            const cursor = teamMembersCollection.find({});
            const teamMembers = await cursor.toArray();
            res.send(teamMembers);
        });

        // // GET API OF BICYCLE CATEGORIES
        // app.get('/bicycleCategories', async (req, res) => {
        //     const cursor = bicycleCategoriesCollection.find({});
        //     const bicycleCategories = await cursor.toArray();
        //     res.send(bicycleCategories);
        // });

        // GET API OF ADD ORDERS
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });

        // GET SINGLE ORDER
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log('Getting specific order', id);
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.json(order);
        });

        // // POST API BICYCLES
        // app.post('/bicycles', async (req, res) => {
        //     const bicycles = req.body;
        //     console.log('hit the post api', bicycles);

        //     const result = await bicyclesCollection.insertOne(tourCategory);
        //     console.log(result);
        //     res.json(result)
        // });

        // POST API ADD ORDERS
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });

        // DELETE API SINGLE ORDER
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });
        //UPDATE API ORDER STATUS
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "Approved"
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            console.log('updating', id)
            res.json(result)
        })

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Bicycle Emporium Server');
});

app.listen(port, () => {
    console.log('Running Bicycle Emporium Server on port', port);
})
