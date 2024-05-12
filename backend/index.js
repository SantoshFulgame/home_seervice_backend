const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require('stripe')
const { sendMail } = require("./helpers/sendMail");

const app = express();

const mongodb=require('./db');
mongodb();
app.use(cors());
app.use(express.json({ limit: "10mb" }));


const PORT = process.env.PORT || 8080;


  //schema
  const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    confirmPassword: String,
    image: String,
    addressLine1: String,
    addressLine2: String, 
    city: String, 
    pincode: String, 
    state: String,  
    country: String, 
  });

  
//
const userModel = mongoose.model("user", userSchema);


app.get("/", (req, res) => {
  res.send("Server is running");
});

//sign up
app.post("/signup", async (req, res) => {
  // console.log(req.body);
  const { email } = req.body;

  userModel.findOne({ email: email }, (err, result) => {
    // console.log(result);
    console.log(err);
    if (result) {
      res.send({ message: "Email id is already register", alert: false });
    } else {
      const data = userModel(req.body);
      const save = data.save();
      res.send({ message: "Successfully sign up", alert: true });
    }
  });
});

//api login
// api login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  userModel.findOne({ email: email }, (err, result) => {
    if (err) {
      console.error("Error finding user:", err);
      res.status(500).send({
        message: "An error occurred while logging in",
        alert: false,
      });
      return;
    }

    if (!result) {
      res.send({
        message: "Email is not registered. Please sign up",
        alert: false,
      });
      return;
    }

    // Compare passwords
    if (password === result.password) {
      const dataSend = {
        _id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
        addressLine1: result.addressLine1,
        addressLine2: result.addressLine2,
        city: result.city,
        pincode: result.pincode,
        state: result.state,
        country: result.country,
      };
      res.send({
        message: "Login successful",
        alert: true,
        data: dataSend,
      });
    } else {
      res.send({
        message: "Incorrect password",
        alert: false,
      });
    }
  });
});

  
  // Define a route for fetching all customers
app.get("/customers", (req, res) => {
  userModel.find({}, (err, results) => {
    if (err) {
      console.error("Error fetching customers:", err);
      res.status(500).send({ message: "Error fetching customers" });
    } else {
      res.send(results);
    }
  });
});


//product section

const schemaProduct = mongoose.Schema({
  name: String,
  category:String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product",schemaProduct)

//save product in data 
//api
app.post("/uploadProduct",async(req,res)=>{
    // console.log(req.body)
    const data = await productModel(req.body)
    const datasave = await data.save()
    res.send({message : "Upload successfully"})
})

//
app.get("/product",async(req,res)=>{
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})


// Get product by ID
app.get('/product/:id', async (req, res) => {
  try {
      const productId = req.params.id;
      const product = await productModel.findById(productId);
      if (!product) {
          res.status(404).json({ error: 'Product not found' });
          return;
      }
      res.json(product);
  } catch (error) {
      console.error('Error fetching product by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


  //schema

// app.use('/api/',require('./routes/createUser'));
// app.use('/api/',require('./routes/OrderHistory'));

// ORDERS SECTION


const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

const Order=mongoose.model('Order',orderSchema);

// Get all orders
app.get('/orders', async (req, res) => {
  try {
      // Find all orders
      const orders = await Order.find();

      // Send the orders back as a response
      res.status(200).json(orders);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Get all orders for a user
app.get('/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Create a new order
app.post('/orders/create', async (req, res) => {
  const { userId, productName, productImage, email, price } = req.body;

  const order = new Order({
    userId: userId,
    productName: productName,
    productImage: productImage,
    email: email,
    price: price
  });

  try {
    const newOrder = await order.save();
    sendMail(email, "Your order has been successfully placed!", `
      Hello ${email},

      Order Details:
      User ID: ${userId}
      Product ID: ${productName}
      Price: ${price}

      We are now connected to your home service needs. Our team will reach out to you as soon as possible.

      Thank you for choosing our service!

      Regards,
      Home Service
    `);
    
    res.status(201).json({ success: true, newOrder });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// app.use('/api/',require('./routes/Products'));

/*****payment getWay */
// console.log(process.env.STRIPE_SECRET_KEY)

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1PAUFxSFQMoIzIImBlA5TLwr"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "inr",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.FRONTEND_URL}/myorders`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }

      
      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})


//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));


