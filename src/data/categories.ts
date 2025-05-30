import type { LucideIcon } from 'lucide-react'; // Using type for Icon definition

export type Category = {
  id: string;
  name: string;
  description?: string;
  // Icon field can be used if specific icons per category are needed from lucide-react
  // For now, it's not used in the CategoryScroller, but useful for other UI parts.
  iconName?: string; // e.g. 'Laptop', 'Shirt', 'Home' from lucide-react names
};

export const categories: Category[] = [
  { id: 'all', name: 'All', description: 'Browse all products' },
  { id: 'electronics', name: 'Electronics', description: 'Latest gadgets and devices', iconName: 'Laptop' },
  { id: 'fashion', name: 'Fashion', description: 'Trendy apparel and accessories', iconName: 'Shirt' },
  { id: 'home-goods', name: 'Home Goods', description: 'Decor and essentials for your home', iconName: 'Home' },
  { id: 'books', name: 'Books', description: 'A wide range of books for every reader', iconName: 'BookOpen' },
  { id: 'sports-outdoors', name: 'Sports & Outdoors', description: 'Equipment for your active lifestyle', iconName: 'Bike' },
  { id: 'beauty-health', name: 'Beauty & Health', description: 'Products for wellness and personal care', iconName: 'Sparkles' },
  { id: 'toys-games', name: 'Toys & Games', description: 'Fun for all ages', iconName: 'ToyBrick' },
];
