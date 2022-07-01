import { MongoClient, ObjectId,  } from "mongodb";
import express from "express"
import { config } from "dotenv";

if ( process.env.NODE_ENV !== "production" ) config()

const client = new MongoClient(process.env.MONGO_URL);
const app = express()

client.connect();
const database = client.db("MySocialNet");
const users = database.collection("users");

app.post("/users/", express.json(), async (request, response)=>{
    const result = await users.insertOne({
        userName: request.body.userName,
        password: request.body.password,
        email: request.body.email,
    });
    response.json(result)
})

app.get("/users/", async (request, response)=>{
    const cursor = users.find()
    response.json( await cursor.toArray() )
})

app.get("/users/by-name/:userName", async (request, response)=>{
    const result = await users.findOne({
        userName: request.params.userName
    })
    response.json( result)
})

app.get("/users/by-id/:userId", async (request, response)=>{
    const result = await users.findOne({
        _id: ObjectId(request.params.userId)
    })
    response.json(result)
})

app.get("/users/no-friends/", async (request, response) => {
    const cursor = users.find(
        {
            friends: { $exists: false }
        }
    ).sort(
        {
            userName: 1
        }
    )
    response.json(await cursor.toArray())
})

app.get("/users/by-id-with-friends/:_id", async (request, response) => {
    const user = await users.findOne({
        _id: ObjectId(request.params._id),
    })
    if ( user ) {
        if (  ! Array.isArray(user.friends) || user.friends.length == 0 ) {
            user.friends = []
        } else {
            const friendsIds = user.friends.map( idString=>ObjectId(idString) )
            const results = users.find({
                _id: { $in: friendsIds }
            })
            user.friends = await results.toArray()
        }
        response.json(user)
    } else {
        response.sendStatus(404)
    }
})

app.put("/users/:_id", express.json(), async (request, response)=>{
    const result = await users.replaceOne(
        {_id: ObjectId(request.params._id)},
        request.body
    )
    response.json(result)
})

app.delete("/users/:_id", async (request, response)=>{
    const result = await users.deleteOne(
        {_id: ObjectId(request.params._id)},
    )
    response.json(result)
})

app.listen(8080, ()=>{console.log("Runnning...")})
