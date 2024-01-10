const mongoose=require('mongoose')

mongoose.connect("mongodb://localhost:27017/accounts")
.then(()=>{
    console.log('mongodb connected');
})
.catch(()=>{
    console.log('error');
})

const tutSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
})

const collection=new mongoose.model('acc',tutSchema)

data=[{
    name:"Tim"
}]
collection.insertMany(data)
