//require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('node:dns');
//const open = require('open');

// Basic Configuration
const port = process.env.PORT || 3006;

// MongoDB
const dotenv = require('dotenv');
dotenv.config({path: 'sample.env'});

let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  url: {
    type:String,
    required: true
  },
  number: Number
});

let Url = mongoose.model('Url', urlSchema);

//
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});



// My Work:
app.get("/api/shorturl/:short?", async function(req, res){
  const shortNum = req.params.short;
  const urlDoc = await Url.findOne({number: shortNum});

  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({"error":"No short URL found for the given input"});
  }
})


app.post("/api/shorturl/", function(req, res){
  let url = req.body.url;
  let shortUrl = url.split("www.")[1]
  let shortNum = 0;

  dns.lookup(shortUrl, (err, address, family) => {
    if (err) {
      res.json({ error: 'Invalid Hostname' });
    } else {
      
      if (!(/^(http|https):\/\//.test(url))) {
        res.json({ error: 'invalid url' })
        
      } else {

        Url.countDocuments({}).then(count => {
          console.log("Urls in DB: " + count);
          Url.findOne({url: url}).then(result => {
              if (result) {
                console.log("Ulr " + url + " ist bereits in BD vorhanden.");
                shortNum = result.number;
              } else {
                console.log("Url nicht in DB");
                shortNum = count + 1;
                let newUrl = new Url({
                  url: url,
                  number: shortNum
                });
                newUrl.save(function(err, storedUrl){
                  if (err) return done(err);
                  console.log(storedUrl.url + " neu in DB gespeichert.");
                })
              }
            res.json({ original_url : url, short_url : shortNum})
          })
        })
      }
    }
  });
});
