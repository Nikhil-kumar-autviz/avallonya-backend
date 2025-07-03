const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String },
    weightCost: { type: Number ,default:0},
    priceCost: { type: Number ,default:0},
    slug:{type:String},
    qid: { type: String },
  },
  { timestamps: true ,versionKey:false}
);
const Category = mongoose.model("category", CategorySchema);
module.exports=Category;
