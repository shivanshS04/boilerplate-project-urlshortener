require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const dns = require('node:dns')

mongoose.connect(process.env.MONGO_URL,{
  useNewUrlParser :true,
  useUnifiedTopology : true
})

const UrlSchema = new mongoose.Schema({
  orignal_url : {
    type: String,
    required: true,
    unique: true
  },
  short_url : {
    type: String,
    required: true,
    unique: true
  }
})

const UrlModel= new mongoose.model("url",UrlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use('/',bodyParser.urlencoded({extended:true}))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:short_url',(req,res)=>{
  let short_url = req.params.short_url;
  UrlModel.findOne({short_url}).then((data)=>{
    res.redirect(data.orignal_url)
  })
})


app.post('/api/shorturl',(req,res)=>{
  let url = req.body.url;
  try{
    urlObj = new URL(url)
    dns.lookup(urlObj.hostname,(err,address,family)=>{
      if(!address){
        res.json({
          error: "invalid url"
        })
      }
      else{
        let orignal_url = urlObj.href;
        
        UrlModel.find({}).sort({
          short_url : -1
        }).limit(1).then((data)=>{
          let short_url = 1;
          if(data.length >0)
            short_url = parseInt(data[0].short_url) +1
          resObj = {
            orignal_url,short_url
          }
              
          let newUrl = new UrlModel(resObj)
          newUrl.save()
          console.log(resObj);
          res.json(resObj)
        })  

      }

    })
  }
  catch{
    res.json({
      error: 'invalid url'
    })
  }
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
