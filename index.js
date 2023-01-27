require('dotenv').config();
const express = require('express');
const cors = require('cors');
var bodyParser = require("body-parser");
let mongoose = require('mongoose');
const app = express();
const dns = require('dns');
const validator = require("validator");
// Basic Configuration
const port = process.env.PORT || 3000;
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret,    {useNewUrlParser: true,
  useUnifiedTopology: true
});
let URL;

let urlSchema = new mongoose.Schema({
  url: String,
  short_url: Number,
})
URL=mongoose.model('URL',urlSchema)
//Utilize body parser to handle POST requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
async function lookupPromise(url) {
  return new Promise((resolve, reject) => {
      dns.lookup(url, (err, address, family) => {
          if(err) resolve(err);
          resolve(address);
      });
 });
};
// Register the URL
// app.post('/api/shorturl', async (req,res)=>{
//   let url = req.body.url;
//   // await dns.lookup(url,{},(err,address,family)=>{
//   //   console.log('family',family)
//   //   if(family===0) res.send({error: 'invalid url'})
//   // })
//   let lookupResult = await lookupPromise(url)
//   if (Object.prototype.toString.call(lookupResult) === "[object Error]") res.send({error: 'invalid url'})
//   else{

//   }
//   res.send(lookupResult)
  
// })
app.post("/api/shorturl", async function (req, res) {
  let formData = req.body.url;
  formData = formData.trim();

  let isCorrect = validator.isURL(formData);

  if (!isCorrect) {
    res.json({ error: "invalid url" });
  } else {
    // steps
    // 1) Store exact data in mongodb
    // 2) Send saved response
    formData = formData.toLowerCase();
  const totalDocsInUrlCollection = await URL.countDocuments();
    const webUrl = new URL({
      url: formData,
     short_url: totalDocsInUrlCollection,
     
    });
    const savedData = await webUrl.save();

    res.json({
      original_url: savedData["url"],
      short_url: savedData["short_url"],
    });
  }
});

app.get("/api/shorturl/:index", async (req, res) => {
  try {
    let index = req.params.index;
    const data = await URL.findOne({ short_url: parseInt(index) });

    if (data) {
      console.log(data)
      res.redirect(data["url"]);
    } else {
      res.json({ error: "No short URL found for the given input" });
    }
  } catch (e) {
    res.json({ error: "No short URL found for the given input" });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
