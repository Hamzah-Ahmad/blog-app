var express           = require("express"),
passport              = require("passport"),
mongoose              = require("mongoose"),
bodyParser            = require("body-parser"),
flash                 = require("connect-flash"),
methodOverride        = require("method-override"),
localStrategy         = require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose");

var app = express();
app.use(express.static(__dirname + "/public/"));
app.use(require("express-session")({
    secret: "This is the secret statement",
    resave: false,
    saveUninitialized: false
}));
var Blog = require("./models/blog");
var User = require("./models/user");
var months = ["Januray", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var port = process.env.PORT || 3000;

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// mongoose.connect("mongodb://localhost/blogs_application"); --> For localDb

// remember to run heroku config:set MONGOLAB_URI="mongodb+srv://Hamzah:hamzahpassword@cluster0-20vtk.mongodb.net/test?retryWrites=true&w=majority""
// in the command line. Otherwise you get an error from heroku
mongoose.connect("mongodb+srv://Hamzah:hamzahpassword@cluster0-20vtk.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() => {
	console.log('Connected to DB!');
}).catch(err => {
	console.log('ERROR:', err.message);
});
app.set("view engine", "ejs");
app.use(flash());
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error =  req.flash("error");
    next();
});
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));


//====================
//BLOG ROUTES
//====================

app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            res.render("home", {blogs: blogs, months:months});
        }
    })
});

app.get("/", function(req, res){
    res.redirect("/blogs");
});

app.get("/blogs/new", isLoggedIn, function(req, res){
    res.render("new");
});

app.post("/blogs", isLoggedIn, function(req, res){
    Blog.create(req.body.blog, function(err, blog){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            // blog.author.id = req.user._id;
            // blog.author.username = req.user.username;
            // blog.save();

            User.findById(req.user._id, function(err, foundUser){
                if(err){
                    req.flash("error", "Something went wrong");
                    res.redirect("/blogs");
                }
                else{
                    blog.author.id = req.user._id;
                    blog.author.username = req.user.username;
                    blog.save();
                    foundUser.blogs.push(blog);
                    foundUser.save(function(err, data){
                        if(err){
                            req.flash("error", "Something went wrong");
                            res.redirect("/blogs");                        }
                        else{
                        }
                    });
                }
                
            });
            res.redirect("/");
        }
    });
});

app.get("/blogs/:id", function(req, res){
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            res.render("show", {blog: blog, months:months});
        }
    });
});

app.get("/blogs/:id/edit", blogOwner, function(req, res){
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }else{
            res.render("edit", {blog: blog})
        }
    })
});

app.put("/blogs/:id", blogOwner, function(req, res){
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, blog){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            res.redirect("/");
        }
    });
});

app.delete("/blogs/:id", blogOwner, function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err, blog){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            res.redirect("/");
        }
    });
});

app.get("/blogs/:*", function(req, res){
    res.redirect("/error");
});
// this route gets the current user's blogs

app.get("/:user/blogs", function(req, res){
    Blog.find({'author.username': req.user.username}, function(err, blogs){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/blogs");
        }
        else{
            res.render("home", {blogs: blogs, months:months});
        }
    });
});

app.get("/error", function(req, res){
    res.render("error");
})

//====================
//AUTH ROUTES
//====================
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/");
        });
    }); 
});

app.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: 'Welcome to YelpCamp!'
}), function(req, res){

});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please login first");
    res.redirect("/login");
};

function blogOwner(req, res, next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id, function(err, foundBlog){
            if(err){
                req.flash("error", "Something went wrong");
                res.redriect("/blogs");
            }
            else{
                if (!foundCampground) {
                    req.flash("error", "Item not found.");
                    return res.redirect("back");
                }

                if(foundBlog.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error", "You donot have the permission to do that");
                    res.redirect("/blogs/"+foundBlog._id);
                }
            }
        });
    }
    else{
        req.flash("error", "You need to login to do that");
        res.redirect("/blogs/"+foundBlog._id);
    }
};

app.listen(port, function(){
    console.log("Server has started");
});