import express from "express";
import bodyParser from "body-parser";
import {MongoClient} from "mongodb";
import mongoose from "mongoose";
import path from 'path';

const app = express(); 
const PORT = 8080;

app.use(express.static(path.join(__dirname,'/build')));

app.use(bodyParser.json());

const withDB = async(operation,res) =>{

    try{

    const client = await MongoClient.connect('mongodb://localhost:27017',{
      useNewUrlParser:true
     })
    const db = client.db('my-blog');

    await operation(db);
    }
    catch(error){
        res.status(500).json({
            message:'Error',err
        })
    }

 }

// mongoose.Promise = global.Promise;
// mongoose.connect('mongodb://localhost:27017/my-blog',{

//     useNewUrlParser:true,
//     useUnifiedTopology:true

//     })

app.get('/',(req,res) =>{
    res.send("hello")
});

app.get('/api/articles/:name', async (req,res)=>{

 withDB(async(db)=>{
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({name:articleName})
    res.status(200).json(articleInfo);

},res)

});

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname+'/build/index.html'));
})


app.get('/hello/:name',(req,res)=>res.send(`Hello ${req.params.name}`))
app.post('/api/articles/:name/upvote',async(req,res)=>{
    // let name = req.body;
    // name.save();
    //res.send(`Hello ${req.body.name}!`)
    withDB(async(db)=>{
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({name:articleName},{
            '$set': {
                upvote:articleInfo.upvote + 1,
            },
        });
            const updatedArticleInfo =  await db.collection('articles').findOne({name:articleName})
        res.status(200).json(updatedArticleInfo);
    
    },res);
   
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
});
