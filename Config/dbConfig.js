const {mongoose} = require('mongoose')


exports.dbConnection = async() =>{
    try {
        await mongoose.connect('mongodb://localhost:27017/Staking')
        console.log('MongoDb Connected')
    } catch (error) {
        console.log(error.message)
    }
}