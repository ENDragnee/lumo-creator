import mongoose from "mongoose";
// Define the schema
const SerializedDataSchema = new mongoose.Schema({
    data: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date, 
        default: Date.now 
    },
    tag: {
        type: [String],
        default: []
    }
});

const SerializedData = mongoose.models.Content || mongoose.model('Content', SerializedDataSchema);

export default SerializedData;