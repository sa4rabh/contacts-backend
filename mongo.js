const mongoose=require("mongoose")
mongoose.connect("mongodb+srv://saurabhkumar620540:int222@cluster0.451drus.mongodb.net/contacts?retryWrites=true&w=majority")
.then(()=>{
    console.log("mongodb connected");
})
.catch(()=>{
    console.log('failed');
})


const newSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

const contact=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    number:{
        type:String,
        required:true
    }
})


const collection = mongoose.model("collection",newSchema)
const contacts = mongoose.model("contacts", contact)

module.exports=collection

