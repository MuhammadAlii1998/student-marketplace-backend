require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/product');
const User = require('./models/user');
const Category = require('./models/category');

const categories = [
  { name: "Books", slug: "books", count: 245 },
  { name: "Electronics", slug: "electronics", count: 189 },
  { name: "Furniture", slug: "furniture", count: 87 },
  { name: "Clothing", slug: "clothing", count: 156 },
  { name: "Sports", slug: "sports", count: 63 },
  { name: "Music", slug: "music", count: 42 },
];

const users = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@edu.devinci.fr",
    password: "password123",
    studentId: "7001234",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    university: "ESILV",
    rating: 4.8,
    reviews: 23
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@edu.devinci.fr",
    password: "password123",
    studentId: "7002345",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    university: "ESILV",
    rating: 5.0,
    reviews: 47
  },
  {
    name: "Mike Brown",
    email: "mike.brown@edu.devinci.fr",
    password: "password123",
    studentId: "7003456",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    university: "ESILV",
    rating: 4.5,
    reviews: 12
  },
  {
    name: "Emma Wilson",
    email: "emma.wilson@edu.devinci.fr",
    password: "password123",
    studentId: "7004567",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    university: "ESILV",
    rating: 4.9,
    reviews: 31
  },
  {
    name: "Demo User",
    email: "demo@edu.devinci.fr",
    password: "demo123",
    studentId: "7005678",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    university: "ESILV",
    rating: 4.7,
    reviews: 19
  }
];

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);
    
    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    
    console.log('Cleared existing data');

    // Seed categories
    await Category.insertMany(categories);
    console.log('Seeded categories');

    // Seed users
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log('Seeded users');

    // Products data
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
        seller: createdUsers[0]._id
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
        seller: createdUsers[1]._id
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
        seller: createdUsers[2]._id
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
        seller: createdUsers[3]._id
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
        seller: createdUsers[4]._id
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
        seller: createdUsers[0]._id
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
        seller: createdUsers[1]._id
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
        seller: createdUsers[2]._id
      }
    ];

    // Seed products
    await Product.insertMany(products);
    console.log('Seeded products');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Demo user credentials:');
    console.log('   Email: demo@edu.devinci.fr');
    console.log('   Password: demo123\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
