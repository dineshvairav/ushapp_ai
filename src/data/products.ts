
import type { Category } from './categories';

export type ProductImage = {
  src: string;
  hint: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category['id'];
  images: ProductImage[]; // Updated to use ProductImage type
  details?: Record<string, string>;
  qty?: number;
  mop?: number;
  dp?: number;
};

// Firebase Storage base URL structure:
// const firebaseStorageBaseUrl = "https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/";
// Example image path: product-images%2Fprod_1_main.webp?alt=media&token=your-token-here

export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Immerse yourself in sound with these premium wireless headphones featuring active noise-cancellation and long battery life for an unparalleled audio experience.',
    price: 199.99,
    category: 'electronics',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_1_headphones_main.webp?alt=media&token=example-token-1a', hint: 'headphones audio' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_1_headphones_detail1.webp?alt=media&token=example-token-1b', hint: 'headphones lifestyle' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_1_headphones_detail2.webp?alt=media&token=example-token-1c', hint: 'headphones product' },
    ],
    details: { 'Color': 'Midnight Black', 'Battery Life': '30 hours', 'Connectivity': 'Bluetooth 5.2', 'Special Feature': 'Active Noise Cancellation' },
    qty: 50,
    mop: 220.00,
    dp: 180.00,
  },
  {
    id: 'prod_2',
    name: 'Modern Minimalist Watch',
    description: 'A sleek and stylish watch with a minimalist design, perfect for any occasion. Features a durable stainless steel case and a comfortable genuine leather strap.',
    price: 129.50,
    category: 'fashion',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_2_watch_main.webp?alt=media&token=example-token-2a', hint: 'watch fashion' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_2_watch_detail1.webp?alt=media&token=example-token-2b', hint: 'watch accessory' },
    ],
    details: { 'Case Material': 'Stainless Steel', 'Strap': 'Genuine Leather', 'Water Resistance': '5 ATM', 'Movement': 'Quartz' },
    qty: 120,
    mop: 150.00,
    dp: 110.00,
  },
  {
    id: 'prod_3',
    name: 'Smart Home Hub Gen 2',
    description: 'Control all your smart home devices with ease using this central hub. Compatible with a wide range of protocols and popular voice assistants.',
    price: 89.00,
    category: 'home-goods',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_3_smarthub_main.webp?alt=media&token=example-token-3a', hint: 'smart home' },
    ],
    details: { 'Compatibility': 'Wi-Fi, Zigbee, Z-Wave, Matter', 'Voice Control': 'Google Assistant, Alexa, Siri', 'Power': 'USB-C' },
    qty: 75,
    mop: 99.00,
    dp: 75.00,
  },
  {
    id: 'prod_4',
    name: 'Ergonomic Office Chair Pro',
    description: 'Stay comfortable and productive with this ergonomic office chair. Features adjustable lumbar support, breathable mesh back, and customizable armrests.',
    price: 249.99,
    category: 'home-goods',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_4_officechair_main.webp?alt=media&token=example-token-4a', hint: 'office chair' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_4_officechair_detail1.webp?alt=media&token=example-token-4b', hint: 'ergonomic furniture' },
    ],
    details: { 'Material': 'High-density Mesh, Aluminum Base', 'Adjustments': 'Height, Lumbar, Tilt, Armrests', 'Weight Capacity': '330 lbs' },
    qty: 30,
    mop: 280.00,
    dp: 220.00,
  },
  {
    id: 'prod_5',
    name: '"The Art of Code" - Extended Edition',
    description: 'A comprehensive guide to writing elegant, efficient, and maintainable code. This extended edition covers modern practices and advanced design patterns.',
    price: 45.00,
    category: 'books',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_5_book_main.webp?alt=media&token=example-token-5a', hint: 'book cover' },
    ],
    details: { 'Author': 'Dr. Ada Coder', 'Pages': '550', 'ISBN': '978-0987654321', 'Format': 'Hardcover' },
    qty: 200,
    mop: 50.00,
    dp: 40.00,
  },
  {
    id: 'prod_6',
    name: 'Professional DSLR Camera Kit',
    description: 'Capture stunning photos and videos with this professional DSLR camera kit. Includes a versatile lens, camera body, and essential accessories.',
    price: 1299.00,
    category: 'electronics',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_6_camera_main.webp?alt=media&token=example-token-6a', hint: 'dslr camera' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_6_camera_detail1.webp?alt=media&token=example-token-6b', hint: 'photography equipment' },
    ],
    details: { 'Sensor': '24MP APS-C', 'Lens': '18-55mm f/3.5-5.6', 'Video': '4K UHD', 'ISO Range': '100-25600' },
    qty: 25,
    mop: 1400.00,
    dp: 1200.00,
  },
  {
    id: 'prod_7',
    name: 'Luxury Silk Scarf',
    description: 'Add a touch of elegance to any outfit with this luxurious 100% silk scarf. Features a vibrant, artistic print.',
    price: 79.90,
    category: 'fashion',
    images: [
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_7_scarf_main.webp?alt=media&token=example-token-7a', hint: 'silk scarf' },
      { src: 'https://firebasestorage.googleapis.com/v0/b/ushapp-af453.appspot.com/o/product-images%2Fprod_7_scarf_detail1.webp?alt=media&token=example-token-7b', hint: 'fashion accessory' },
    ],
    details: { 'Material': '100% Mulberry Silk', 'Dimensions': '90cm x 90cm', 'Care': 'Dry Clean Only', 'Design': 'Abstract Floral' },
    qty: 80,
    mop: 90.00,
    dp: 70.00,
  },
];

