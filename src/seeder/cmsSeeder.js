const Content = require("../models/cmsModel");

const defaultContent = [
  {
    key: 'featureCards',
    value: [
      {
        id: 1,
        title: "Unbeatable Wholesale Prices",
        description: "Compare offers from 500+ wholesalers, brands and distributors in one combined catalog"
      },
      {
        id: 2,
        title: "Low Minimum Orders",
        description: "Avallonya negotiates on your behalf, so small businesses can enjoy bulk prices usually reserved for large retailers"
      },
      {
        id: 3,
        title: "Guaranteed Authenticity",
        description: "Every product is sourced from trusted suppliers, ensuring 100% genuine items"
      }
    ]
  },
  {
    key: 'cosmeticBrandsHeader',
    value: {
      title: "Trusted Cosmetic Brands",
      subtitle: "Stock Your Shelves with the Best",
      titleColor: "#c7a17a"
    }
  }
];

async function seedContent() {
  try {
    // Using bulk operations for better performance
    const bulkOps = defaultContent.map(content => ({
      updateOne: {
        filter: { key: content.key },
        update: { $setOnInsert: content }, // Only set if inserting new
        upsert: true
      }
    }));

    const result = await Content.bulkWrite(bulkOps);
    
    // Log results
    const insertedCount = result.upsertedCount;
    const modifiedCount = result.modifiedCount;
    
    console.log(`Content seeding completed:`);
    console.log(`- ${insertedCount} new content items inserted`);
    console.log(`- ${modifiedCount} existing items checked`);
    
    return {
      insertedCount,
      modifiedCount,
      upsertedIds: result.upsertedIds
    };
    
  } catch (error) {
    console.error('Error seeding content:', error);
    throw error;
  }
}

module.exports = { seedContent };