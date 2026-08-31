import type { ModifierGroup } from "@/db/schema";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags?: string[];
  modifiers?: ModifierGroup[];
  available?: boolean;
  soldOut?: boolean;
};

export const menuCategories = [
  { id: "breakfast", name: "Breakfast & Benny", icon: "🍳" },
  { id: "sweet", name: "Sweet Treats", icon: "🥞" },
  { id: "lunch", name: "Lunch Mains", icon: "🥗" },
  { id: "drinks", name: "Drinks", icon: "☕" },
];

const eggStyle: ModifierGroup = {
  id: "eggs",
  name: "Egg style",
  required: true,
  options: [
    { label: "Poached", price: 0 },
    { label: "Fried", price: 0 },
    { label: "Scrambled", price: 0 },
  ],
};

const breadChoice: ModifierGroup = {
  id: "bread",
  name: "Bread / base",
  required: true,
  options: [
    { label: "Toasted ciabatta", price: 0 },
    { label: "Hash browns (gluten-free)", price: 0 },
    { label: "Gluten-free toast", price: 1.5 },
  ],
};

const extraSides: ModifierGroup = {
  id: "sides",
  name: "Add extras",
  required: false,
  options: [
    { label: "No extras", price: 0 },
    { label: "Avocado", price: 3.5 },
    { label: "Extra bacon", price: 4 },
    { label: "Halloumi", price: 4.5 },
    { label: "Hash brown", price: 3 },
  ],
};

const milkType: ModifierGroup = {
  id: "milk",
  name: "Milk",
  required: true,
  options: [
    { label: "Full cream", price: 0 },
    { label: "Trim", price: 0 },
    { label: "Oat (vegan)", price: 1 },
    { label: "Almond (vegan)", price: 1 },
    { label: "Soy", price: 1 },
  ],
};

const coffeeSize: ModifierGroup = {
  id: "size",
  name: "Size",
  required: true,
  options: [
    { label: "Regular", price: 0 },
    { label: "Large", price: 1 },
  ],
};

const extraShot: ModifierGroup = {
  id: "shot",
  name: "Espresso",
  required: false,
  options: [
    { label: "Standard", price: 0 },
    { label: "Extra shot", price: 1 },
  ],
};

const steakDoneness: ModifierGroup = {
  id: "doneness",
  name: "Cooked",
  required: true,
  options: [
    { label: "Medium-rare", price: 0 },
    { label: "Medium", price: 0 },
    { label: "Medium-well", price: 0 },
    { label: "Well done", price: 0 },
  ],
};

const shakeFlavour: ModifierGroup = {
  id: "flavour",
  name: "Flavour",
  required: true,
  options: [
    { label: "Chocolate", price: 0 },
    { label: "Strawberry", price: 0 },
    { label: "Vanilla", price: 0 },
    { label: "Caramel", price: 0 },
  ],
};

const smoothieFlavour: ModifierGroup = {
  id: "smoothie",
  name: "Daily flavour",
  required: true,
  options: [
    { label: "Berry blast", price: 0 },
    { label: "Mango passion", price: 0 },
    { label: "Banana honey", price: 0 },
    { label: "Green goodness", price: 0 },
  ],
};

export const menuItems: MenuItem[] = [
  {
    id: "eggs-benny-pork",
    name: "Eggs Benedict – Pork Belly",
    description: "Two eggs on toasted ciabatta with tender pork belly, hollandaise, and fresh salad.",
    price: 22.5,
    category: "breakfast",
    image: "https://images.pexels.com/photos/4663235/pexels-photo-4663235.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "eggs-benny-bacon",
    name: "Eggs Benedict – Bacon",
    description: "Two eggs on toasted ciabatta with crispy bacon, hollandaise, and mixed greens.",
    price: 21,
    category: "breakfast",
    image: "https://images.pexels.com/photos/5620668/pexels-photo-5620668.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "eggs-benny-salmon",
    name: "Eggs Benedict – Salmon",
    description: "Two eggs on toasted ciabatta with smoked salmon, hollandaise, capers, and dill.",
    price: 23.5,
    category: "breakfast",
    image: "https://images.pexels.com/photos/4663235/pexels-photo-4663235.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: [],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "eggs-benny-mushroom",
    name: "Eggs Benedict – Mushroom",
    description: "Two eggs on toasted ciabatta with sautéed mushrooms and hollandaise. Vegetarian.",
    price: 20,
    category: "breakfast",
    image: "https://images.pexels.com/photos/5620668/pexels-photo-5620668.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Vegetarian"],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "big-breakfast",
    name: "Big Breakfast",
    description: "Two eggs, bacon, sausage, hash brown, mushrooms, grilled tomato, and toast.",
    price: 24,
    category: "breakfast",
    image: "https://images.pexels.com/photos/15043921/pexels-photo-15043921.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular", "Large"],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "supreme-breakfast",
    name: "Supreme Breakfast",
    description: "The Big Breakfast plus pork belly, extra egg, and avocado. For the biggest appetites.",
    price: 28,
    category: "breakfast",
    image: "https://images.pexels.com/photos/15043921/pexels-photo-15043921.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Large"],
    modifiers: [eggStyle, breadChoice, extraSides],
  },
  {
    id: "french-toast",
    name: "Brioche French Toast",
    description: "Thick-cut brioche in vanilla custard, seasonal fruit, maple syrup, and cream.",
    price: 21,
    category: "sweet",
    image: "https://images.pexels.com/photos/30458468/pexels-photo-30458468.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [
      {
        id: "cream",
        name: "Topping",
        required: false,
        options: [
          { label: "Maple & cream", price: 0 },
          { label: "Berry compote", price: 1.5 },
          { label: "Bacon on the side", price: 4 },
        ],
      },
    ],
  },
  {
    id: "blueberry-pancakes",
    name: "Blueberry Pancakes",
    description: "Fluffy buttermilk stack with blueberries, whipped cream, and maple syrup.",
    price: 19.5,
    category: "sweet",
    image: "https://images.pexels.com/photos/754959/pexels-photo-754959.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [
      {
        id: "stack",
        name: "Stack size",
        required: true,
        options: [
          { label: "Regular stack", price: 0 },
          { label: "Kids stack", price: -4 },
        ],
      },
    ],
  },
  {
    id: "cronuts",
    name: "Cronuts",
    description: "Fresh croissant-donut hybrid filled with cream and cinnamon sugar.",
    price: 8.5,
    category: "sweet",
    image: "https://images.pexels.com/photos/5602618/pexels-photo-5602618.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: [],
  },
  {
    id: "custard-donuts",
    name: "Custard Donuts",
    description: "Warm donuts filled with vanilla custard and finished with chocolate drizzle.",
    price: 7.5,
    category: "sweet",
    image: "https://images.pexels.com/photos/35531590/pexels-photo-35531590.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: [],
  },
  {
    id: "chicken-blt",
    name: "Chicken BLT",
    description: "Grilled chicken, bacon, lettuce, tomato, and aioli on ciabatta. Served with fries.",
    price: 22,
    category: "lunch",
    image: "https://images.pexels.com/photos/17486821/pexels-photo-17486821.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [
      {
        id: "side",
        name: "Side",
        required: true,
        options: [
          { label: "Fries", price: 0 },
          { label: "Garden salad", price: 0 },
          { label: "Sweet potato fries", price: 2 },
        ],
      },
    ],
  },
  {
    id: "beef-lok-lak",
    name: "Beef Lok Lak on Rice",
    description: "Cambodian-style beef with pepper-lime sauce, jasmine rice, and a fried egg.",
    price: 23,
    category: "lunch",
    image: "https://images.pexels.com/photos/17308546/pexels-photo-17308546.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [eggStyle],
  },
  {
    id: "lamb-curry",
    name: "Lamb Curry with Rice",
    description: "Slow-cooked lamb in aromatic spices with basmati rice and naan.",
    price: 24,
    category: "lunch",
    image: "https://images.pexels.com/photos/38324444/pexels-photo-38324444.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Gluten-Free Available"],
    modifiers: [
      {
        id: "heat",
        name: "Spice",
        required: true,
        options: [
          { label: "Mild", price: 0 },
          { label: "Medium", price: 0 },
          { label: "Hot", price: 0 },
        ],
      },
    ],
  },
  {
    id: "scotch-fillet",
    name: "Scotch Fillet",
    description: "250g scotch fillet with seasonal vegetables and mashed potato.",
    price: 29,
    category: "lunch",
    image: "https://images.pexels.com/photos/27643019/pexels-photo-27643019.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Premium"],
    modifiers: [steakDoneness],
  },
  {
    id: "flat-white",
    name: "Flat White",
    description: "Double-shot espresso with velvety steamed milk. Our signature coffee.",
    price: 5.5,
    category: "drinks",
    image: "https://images.pexels.com/photos/894696/pexels-photo-894696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Popular"],
    modifiers: [coffeeSize, milkType, extraShot],
  },
  {
    id: "iced-matcha",
    name: "Iced Matcha Latte",
    description: "Premium Japanese matcha whisked with cold milk over ice.",
    price: 7,
    category: "drinks",
    image: "https://images.pexels.com/photos/38345070/pexels-photo-38345070.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Vegan Available"],
    modifiers: [milkType],
  },
  {
    id: "fruit-smoothie",
    name: "Fruit Smoothies",
    description: "Freshly blended seasonal fruit with yoghurt. Ask about daily flavours.",
    price: 8.5,
    category: "drinks",
    image: "https://images.pexels.com/photos/8394976/pexels-photo-8394976.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: ["Healthy"],
    modifiers: [smoothieFlavour],
  },
  {
    id: "thickshake",
    name: "Thickshakes",
    description: "Creamy thickshake in chocolate, strawberry, vanilla, or caramel.",
    price: 9,
    category: "drinks",
    image: "https://images.pexels.com/photos/6463660/pexels-photo-6463660.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: [],
    modifiers: [shakeFlavour],
  },
  {
    id: "milkshake",
    name: "Milkshakes",
    description: "Classic milkshakes blended to order. Choose your flavour.",
    price: 7.5,
    category: "drinks",
    image: "https://images.pexels.com/photos/5005919/pexels-photo-5005919.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tags: [],
    modifiers: [shakeFlavour],
  },
];

export const defaultPromos = [
  { code: "WELCOME10", type: "percent", value: 10, minCents: 2000, description: "10% off orders over $20" },
  { code: "ALENNA5", type: "fixed", value: 500, minCents: 2500, description: "$5 off orders over $25" },
  { code: "COFFEELOVE", type: "fixed", value: 550, minCents: 1500, description: "Free regular flat white value off $15+" },
];

export const defaultSettings = {
  orderingEnabled: true,
  maxOrdersPerSlot: 8,
  minNoticeMinutes: 30,
  slotMinutes: 30,
  loyaltySpendPerPoint: 100,
  loyaltyRedeemValue: 5,
  gstIncluded: true,
  kitchenPrinter: false,
};
