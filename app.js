const express = require('express');
const app = express();
const server = require('http').createServer(app);
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const config = require('./config');
const { checkUser, requireAuth } = require('./middleware/authMiddleware');

const mongoose = require('mongoose');
const uri = config.getMongoURL();
const connectDB = function(){
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
        .then((result) => console.log('Connected to db'))
        .catch((err) => console.log(err));
}

const authRouter = require('./routes/authRoutes');
const activityRouter = require('./routes/activityRoutes');

// let csrfProtection = csrf({ cookie: true });
let csrfOmit = ['/login','/signup'];

//ejs view engine
app.set('view engine', 'ejs');

//server listen
server.listen(3000, () => {
    console.log('Listening on port 3000');
    connectDB();
});

//middleware, static hosting, array of strings parser, json parser, logger
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' https://use.fontawesome.com https://cdn.jsdelivr.net http://cdnjs.cloudflare.com");
    next();
});
// app.use((req, res, next) => {
//     if(csrfOmit.indexOf(req.path)!==-1){
//         next();
//     }else{
//         csrf({ cookie: true })(req,res,next);
//     }
// });
app.use(morgan('dev'));

app.get('*', checkUser);

//ROOT Route
app.get('/', (req, res) => {
    res.render('tabs/home', {
        title: 'Home'
    });
});

//AUTH Routes
app.use(authRouter);

//ACTIVITY Routes
// app.use(requireAuth, activityRouter);
app.use(activityRouter);

//404 page
app.use((req, res) => {
    res.status(404).render('404', { title: '404' });
});