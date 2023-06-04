const mongoose = require('mongoose');

const url = "mongodb+srv://saurabhkumar620540:int222@cluster0.451drus.mongodb.net/chatusers?retryWrites=true&w=majority";

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))