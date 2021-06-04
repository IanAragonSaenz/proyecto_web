const express = require('express');
const app = express();
var cors = require('cors');
const port = 3000;
const axios = require('axios').default;
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require('path');
 
var collection;
var cart;
var users;

app.use(cors());
app.use(express.json()); // body-parser
app.use(cookieParser());
app.use(express.static('./'));

const secret = "5tr0n6P@55W0rD";

const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({ storage: storage});
const { response } = require('express');

const uri = "mongodb+srv://wanderer:hahaesto123@cluster0.6qswt.mongodb.net/cartDB?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});
client.connect(err => {
	collection = client.db("cartDB").collection("products"); 
    cart = client.db("cartDB").collection("cart");
    users = client.db("cartDB").collection("user");
});

app.get('/login', function (req, res) {
    res.sendFile('login.html', {root: './pages/'});
});

app.get('/register', function (req, res) {
    res.sendFile('register.html', {root: './pages/'});
});

app.get('/cart', requireLogin, function (req, res) {
    ejs.renderFile('./pages/user-cart.html', {user: req.user}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });
});

app.get('/', requireLogin, function (req, res) {
    console.log(req.user);
    ejs.renderFile('./pages/main.html', {user: req.user}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });
});

app.get('/products', requireLogin, function(req, res) {
    ejs.renderFile('./pages/user-products.html', {user: req.user}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });  
});

//pages loading backend
app.get('/root/admin/products', requireAdminLogin, function(req, res) {
    res.sendFile("./pages/admin-products.html", {root: __dirname});    
});

app.get('/root/admin/add', requireAdminLogin, function(req, res) {
    res.sendFile("./pages/add.html", {root: __dirname});    
});

app.get('/root/admin/edit', requireAdminLogin, function(req, res) {
	res.sendFile("./pages/edit-product.html", {root: __dirname}); 
});

app.get('/root/admin/:id/edit', requireAdminLogin, function(req, res) {
    let productId  = req.params.id;
    ejs.renderFile("./pages/edit-product.html", {productId: productId}, null, function(err, str){
        if (err) res.status(503).send(`error when rendering the view: ${err}`); 
        else {
            res.end(str);
        }
    });
});


app.get('/products/all', requireLogin, async function(req, res){  
    let products = await collection.find().toArray(); 
    res.send(products);
});

app.post('/product/add/:id/:pid', requireLogin, async function(req, res){  
    let userId  = req.params.id;
    let pid = req.params.pid;
    cart.insertOne({
		uid: userId,
		pid: pid
	}, function(err, res) {
		if (err) throw err;
		console.log("1 document inserted");
	});
});

app.delete('/products', requireLogin, function(req, res) {

    let productId  = req.query.id;
	collection.deleteOne({
		_id: new mongo.ObjectID(productId)
	}, function(err, obj) {
		if (err) throw err;
		console.log("1 document deleted");
	});
})

app.post('/clear/:id', requireLogin, async function(req, res) {
    let uid  = req.params.id;
    cart.deleteMany({uid: uid}, function(err, obj) {
		if (err) throw err;
		console.log("documents deleted");
        res.send(200);
	});
})

app.get('/cart/:id', requireLogin, async function(req, res) {
    let uid  = req.params.id;
    products = [];
    let c = await cart.find({uid: uid}).toArray();
     
    for(const p of c) {
        let pid = new mongo.ObjectID(p.pid);
        let pro = await collection.findOne({_id: pid});
        products.push(pro);
    };
    
    res.send(products);
})

app.post('/cart/:id/:pid', requireLogin, async function(req, res) {
    let uid  = req.params.id;
    let pid  = req.params.pid;
    cart.deleteOne({uid: uid, pid: pid}, function(err, obj) {
		if (err) throw err;
		console.log("1 document deleted");
	});
})


app.get('/users/:id', requireLogin, async function(req, res) {
    let uid  = req.params.id;
    let user = await users.find().toArray();
	user.forEach(u => {
		if(u._id == uid){
			res.send(u);
		}
	});	
})

app.post('/user/register', upload.single('avatar'), (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    if(req.file){
        avatarObject = {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/jpg'
        };
    } else {
        avatarObject = null;
    }

    bcrypt.genSalt(10, (saltError, salt) => {
        if (saltError) {
            return;
        } else {
            bcrypt.hash(password, salt, function(hashError, hash) {
                if (hashError) {
                    return;
                }
                users.insertOne({
                    name: name,
                    email: email,
                    password: hash,
                    avatar: avatarObject,
                    role: 'user'
                }, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                });
            }) 
        }
    })

    res.redirect('/login');  
});



app.post('/users/:id', requireLogin, upload.single('avatar'), async function(req, res){
    let uid  = new mongo.ObjectID(req.params.id);
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    avatarObject = {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/jpg'
    };

    bcrypt.genSalt(10, function (saltError, salt) {
        if (saltError) {
          return;
        } else {
          bcrypt.hash(password, salt, function(hashError, hash) {
            if (hashError) {
              return;
            }
            users.update({_id: uid},  {$set: {name: name, email: email, password: hash, avatar: avatarObject }}, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
            });
          })
        }
    })

    
});

app.post('/login', async function (req, res) {
    const { email, password } = req.body;
    const user = await users.findOne({email: email});

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(403).send('Invalid Email or Password.');

    if (user) {
        console.log(`Succesfully logged ${email} in`);
        // Generate an access token
        const accessToken = generateToken(user);
        res.cookie("authorization", accessToken, {secure: true, httpOnly: true});
        res.status(200).json(accessToken).redirect('/');
    }else{
        res.status(403).send('Invalid credentials');
    }
    
});

app.post('/logout', requireLogin, function(req, res){
    console.log(`Logging out ${req.name}`)
    res.clearCookie('authorization');
    res.send('User logged out');
});



//users backend ----------------------------------------------------------------------------------------------
function generateToken(user) {
    let payload = {
     name: user.name,
     id: user._id,
     role: user.role
    };
    let oneDay = 60 * 60 * 24;
    return token = jwt.sign(payload, secret, { expiresIn: oneDay });
}

// middleware that add the user
function requireLogin(req, res, next){
    let accessToken = req.cookies.authorization
    // if there is no token stored in cookies, the request is unauthorized
    if (!accessToken){ 
        console.log('Unauthorized user, redirecting to login'); 
        return res.redirect('/login'); 
    }

    try{
        // use the jwt.verify method to verify the access token, itthrows an error if the token has expired or has a invalid signature
        payload = jwt.verify(accessToken, secret)
        console.log('Logged user accessing the site ' + payload.username);
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        next()
    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        res.redirect(403, '/login');
    }
}

// middleware that add the user
function requireAdminLogin(req, res, next){
    let accessToken = req.cookies.authorization
    // if there is no token stored in cookies, the request is unauthorized
    if (!accessToken){ 
        console.log('Unauthorized user, redirecting to login'); 
        return res.redirect('/login'); 
    }

    try{
        // use the jwt.verify method to verify the access token, itthrows an error if the token has expired or has a invalid signature
        payload = jwt.verify(accessToken, secret)
		if(payload.role != 'admin'){
			console.log('Unauthorized user, redirecting to login');
			return res.redirect('/products'); 
		}
        console.log('Logged user accessing the site ' + payload.username);
        req.user = payload; // you can retrieve further details from the database. Here I am just taking the name to render it wherever it is needed.
        next()
    }
    catch(e){
        //if an error occured return request unauthorized error, or redirect to login
        // return res.status(401).send():
        res.redirect(403, '/login');
    }
}



//
// Admin functions -----------------------------------------------------------------------------------------------
//

//products backend
app.put('/root/admin/product/:id', requireAdminLogin, function(req, res) {
    let productId  = req.params.id;
    let{ name, price, brand} = req.body;
    var id = new mongo.ObjectID(productId);
	collection.update({_id: id},  {$set: {name: name, price: price, brand: brand }}, function(err, res) {
		if (err) throw err;
		console.log("1 document updated");
	});
})

app.get('/root/admin/product/:id', requireAdminLogin, async function(req, res) {
    let productId  = req.params.id;
    let product = await collection.find().toArray();
	product.forEach(pro => {
		if(pro._id == productId){
			res.send(pro);
		}
	});	
})

app.get('/root/admin/products/all', requireAdminLogin, async function(req, res){  
    let products = await collection.find().toArray(); 
    res.send(products);
});

app.delete('/root/admin/products', requireAdminLogin, function(req, res) {

    let productId  = req.query.id;
	collection.deleteOne({
		_id: new mongo.ObjectID(productId)
	}, function(err, obj) {
		if (err) throw err;
		console.log("1 document deleted");
	});
})

app.post('/root/admin/product/create', requireAdminLogin, function(req, res) {

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

