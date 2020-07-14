
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:test123@cluster0-bhnuh.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

app.get('/favicon.ico', (req, res) => res.status(204));

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

  List.find({}, function(err, foundLists){
    if (err) {
      console.log(err);
    } else {

      Item.find({}, function(err, foundItems){
        if (foundItems.length === 0) {
          Item.insertMany(defaultItems, function(err){
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully saved default items to DB.");
            }
          });
          res.redirect("/");
        } else {
          res.render("list", {listTitle: "Today", newListItems: foundItems, newListList: foundLists});
        }
      });
    }
  });
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.find({}, function(err, foundLists){
    if (err) {
      console.log(err);
    } else {
      List.findOne({name:customListName}, function(err, foundItems){
        if (err) { console.log(err)}
        else {
          console.log(foundItems);
          res.render("list", {listTitle: customListName, newListItems: foundItems.items, newListList: foundLists});
        }
      });
    }
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (err) {console.log(err)}
      else {
        foundList.items.push(item);
        foundList.save();
        List.find({}, function(err, foundLists){
          if (err) {console.log(err)}
          else{
            res.render("list", {listTitle: listName, newListItems: foundList.items, newListList: foundLists});
          }
        })
      }
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  console.log(checkedItemId);
  console.log(listName);

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.post('/newlist', function(req, res){
  const listName = _.capitalize(req.body.newListName);

  const list = new List({
    name: listName,
    items: defaultItems
  });

  List.findOne({name:listName}, function(err, foundList){
    if (err) {console.log(err)}
    else{
      if (!foundList){
        list.save();
        res.redirect(`/${listName}`);
      } else {
        res.redirect(`/${listName}`);
      }
    }
  });
});


app.post('/deletelist', function(req, res){
  const listName = req.body.deletelist;
  const currentList = req.body.currentListName;

  console.log(listName);
  console.log(currentList);

  if (currentList === listName) {
    List.findOneAndRemove({name: listName}, function(err){
      if (err) {console.log(err);}
      else{
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndRemove({name: listName}, function(err){
      if (err) {console.log(err);}
      else{
        res.redirect(`/${currentList}`);
      }
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started");
});