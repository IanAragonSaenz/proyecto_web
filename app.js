const express = require('express');
const app = express();
var cors = require('cors');
const port = 3000;
const axios = require('axios').default;
app.use(cors());
app.use(express.json()); // body-parser
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
const ejs = require('ejs');

var collection;

app.use(express.static('./'));

const uri = "mongodb+srv://wanderer:hahaesto123@cluster0.6qswt.mongodb.net/cartDB?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});
client.connect(err => {
	collection = client.db("cartDB").collection("products"); 
});

app.get('/', (req, res) => {
    res.sendFile("./shopping-cart.html", {root: __dirname});    
});

app.get('/add', (req, res) => {
    res.sendFile("./add.html", {root: __dirname});    
});

app.post('/edit-product', (req, res) => {
	res.sendFile("./edit-product.html", {root: __dirname});  ;  
	console.log("what");
	
});

app.route('/:id/edit').get((req, res) => {
    let productId  = req.params.id;
    ejs.renderFile("./edit-product.html", {productId: productId}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });
});

app.route('/product/:id').put((req, res) => {
    let productId  = req.params.id;
    let{ name, price, brand} = req.body;
    var id = new mongo.ObjectID(productId);
	collection.update({_id: id},  {$set: {name: name, price: price, brand: brand }}, function(err, res) {
		if (err) throw err;
		console.log("1 document updated");
	});
})

app.route('/product/:id').get(async function(req, res) {
    let productId  = req.params.id;
    let product = await collection.find().toArray();
	product.forEach(pro => {
		if(pro._id == productId){
			res.send(pro);
		}
	});	
})

app.route('/products').get(async function(req, res){  
    let products = await collection.find().toArray(); 
    res.send(products);
});

app.post('/removeProduct', function (req, res) {

    let productId  = req.query.id;
	collection.deleteOne({
		_id: new mongo.ObjectID(productId)
	}, function(err, obj) {
		if (err) throw err;
		console.log("1 document deleted");
	});
})


app.post('/addProduct', function (req, res) {

    let nameParam = req.query.name;
	let priceParam = req.query.price;
	let brandParam = req.query.brand;
   console.log(req.query);
	collection.insertOne({
		name: nameParam,
		price: priceParam,
		brand: brandParam,
	}, function(err, res) {
		if (err) throw err;
		console.log("1 document inserted");
	});

  })


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

