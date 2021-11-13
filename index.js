const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vbla2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// verify token 
async function verifyToken(req, res, next) {
    if (req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        console.log('Database connected');
        const database = client.db('bicycleEmporium');
        const bicyclesCollection = database.collection('bicycles');

        const usersCollection = database.collection('users');
        const teamMembersCollection = database.collection('teamMembers');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');

        //--------------------------USERS--------------------------

        // GET API OF USERS
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });

        // POST API OF USERS
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(req.body);
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        // PUT API OF USERS
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //--------------------------ADMIN--------------------------

        // GET API OF ADMIN
        // app.get('/users/:email', async (req, res) => {

        //     const email = req.params.email;
        //     if (email) {
        //         const query = { email: email };
        //         const user = await usersCollection.findOne(query);
        //         // console.log('this is user', user);
        //         let isAdmin = false;
        //         // if (user) {
        //             if (user?.role === 'admin') {
        //                 isAdmin = true;
        //             }
        //             res.json({ admin: isAdmin });
        //         // }
        //         // else {
        //         //     res.json({ admin: false });
        //         // }

        //     }
        //     else {
        //         res.json({ admin: false });
        //     }

        // });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // PUT API OF ADMIN

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const requester = req.decodedEmail;
            console.log('requester', requester);
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                console.log('requesterAccount', requesterAccount);
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'You do not have access to make admin' })
            }

        });

        // app.put('/users/admin', async (req, res) => {
        //     const user = req.body;
        //     console.log('put', user);
        //     const filter = { email: user.email };
        //     const updateDoc = { $set: { role: 'admin' } };
        //     const result = await usersCollection.updateOne(filter, updateDoc);
        //     res.json(result);
        // })

        // --------------------------BICYCLES--------------------------

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

        // POST API BICYCLES
        app.post('/bicycles', async (req, res) => {
            const bicycle = req.body;
            console.log('hit the post api', bicycle);

            const result = await bicyclesCollection.insertOne(bicycle);
            console.log(result);
            res.json(result);
        });

        // DELETE API SINGLE BICYCLE
        app.delete('/bicycles/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bicyclesCollection.deleteOne(query);
            res.json(result);
        });

        // --------------------------TEAM MEMBERS--------------------------

        // GET API OF TEAM MEMBERS
        app.get('/teamMembers', async (req, res) => {
            const cursor = teamMembersCollection.find({});
            const teamMembers = await cursor.toArray();
            res.send(teamMembers);
        });

        // --------------------------REVIEWS-------------------------- 

        // GET API OF REVIEWS
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // POST API OF REVIEWS
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(req.body);
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
            res.json(result);
        });

        // --------------------------ORDERS--------------------------

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
        });

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
