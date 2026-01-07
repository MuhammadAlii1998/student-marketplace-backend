require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/product');
const User = require('./models/user');
const Category = require('./models/category');

// Categories without hardcoded counts (will be dynamic based on products)
const categories = [
  { name: "Books", slug: "books" },
  { name: "Electronics", slug: "electronics" },
  { name: "Furniture", slug: "furniture" },
  { name: "Clothing", slug: "clothing" },
  { name: "Sports", slug: "sports" },
  { name: "Music", slug: "music" },
  { name: "Others", slug: "others" }
];

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);
    
    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    
    console.log('Cleared existing products and categories');

    // Seed categories (without counts - will be calculated dynamically)
    await Category.insertMany(categories);
    console.log('Seeded categories');

    // Find or verify the main user account
    let mainUser = await User.findOne({ email: 'muhammad.ali@edu.devinci.fr' });
    
    if (!mainUser) {
      console.log('⚠️  User muhammad.ali@edu.devinci.fr not found!');
      console.log('Please register this account first or update the email in seed.js');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${mainUser.name} (${mainUser.email})`);

    // Sample products - all linked to muhammad.ali@edu.devinci.fr
    const products = [
      {
        title: "Calculus: Early Transcendentals 8th Edition",
        description: "Perfect condition calculus textbook. Used for one semester only. Includes all pages with minimal highlighting. Great for MATH 101-201 courses.",
        price: 45.00,
        originalPrice: 150.00,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=600&fit=crop",
        ],
        category: "Books",
        condition: "like-new",
        location: "Campus Library",
        seller: mainUser._id
      },
      {
        title: "MacBook Pro 13\" 2021 - M1 Chip",
        description: "Selling my MacBook Pro in excellent condition. 256GB SSD, 8GB RAM. Includes original charger and box. Perfect for programming and design work.",
        price: 850.00,
        originalPrice: 1299.00,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop",
        ],
        category: "Electronics",
        condition: "good",
        location: "Engineering Building",
        seller: mainUser._id
      },
      {
        title: "IKEA KALLAX Shelf Unit - White",
        description: "4x4 KALLAX shelf unit in white. Great for organizing books, storage boxes, and decorations. Minor scratches on top, otherwise in great shape.",
        price: 35.00,
        originalPrice: 89.99,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
        ],
        category: "Furniture",
        condition: "fair",
        location: "Student Housing",
        seller: mainUser._id
      },
      {
        title: "TI-84 Plus CE Graphing Calculator",
        description: "Essential for all math and science courses. Full color display, rechargeable battery. Includes charging cable and protective cover.",
        price: 75.00,
        originalPrice: 130.00,
        image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop",
        ],
        category: "Electronics",
        condition: "like-new",
        location: "Math Building",
        seller: mainUser._id
      },
      {
        title: "Organic Chemistry Textbook + Study Guide",
        description: "Complete set including textbook and study guide with practice problems. Perfect for pre-med students.",
        price: 55.00,
        originalPrice: 220.00,
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop",
        ],
        category: "Books",
        condition: "good",
        location: "Science Center",
        seller: mainUser._id
      },
      {
        title: "Sony WH-1000XM4 Headphones",
        description: "Industry-leading noise cancellation headphones. Includes case, cable, and airplane adapter. Battery life is still excellent.",
        price: 180.00,
        originalPrice: 349.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
        ],
        category: "Electronics",
        condition: "like-new",
        location: "Student Center",
        seller: mainUser._id
      },
      {
        title: "Ergonomic Desk Chair - Black",
        description: "Comfortable desk chair with lumbar support, adjustable height, and armrests. Perfect for long study sessions.",
        price: 95.00,
        originalPrice: 199.99,
        image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=600&fit=crop",
        ],
        category: "Furniture",
        condition: "good",
        location: "Off-Campus Housing",
        seller: mainUser._id
      },
      {
        title: "Nike Dunk Low - Size 10",
        description: "Worn twice, in excellent condition. Original box and extra laces included. Great for campus walking!",
        price: 85.00,
        originalPrice: 120.00,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
        ],
        category: "Clothing",
        condition: "like-new",
        location: "Campus Store",
        seller: mainUser._id
      }
    ];

    // Seed products
    const createdProducts = await Product.insertMany(products);
    console.log(`Seeded ${createdProducts.length} products`);

    // Update category counts dynamically
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category.name });
      await Category.updateOne(
        { slug: category.slug },
        { $set: { count: count } }
      );
    }
    console.log('Updated category counts dynamically');

    console.log('\n✅ Database seeded successfully!');
    console.log(`\n📦 Created ${createdProducts.length} products for ${mainUser.name}`);
    console.log(`📧 User: ${mainUser.email}\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
