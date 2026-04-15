export const menuData = [
  {
    id: "ramen",
    title: "Ramen",
    subtitle: "Signature Broths",
    items: [
      {
        id: "tonkotsu-ramen",
        name: "Tonkotsu Ramen",
        description: "Creamy pork bone broth, chashu pork, soft-boiled egg, and black garlic oil.",
        price: 18.00,
        category: "RAMEN",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: [
          { name: "Extra Chashu Pork", price: 3.00 },
          { name: "Ajitama Soft Boiled Egg", price: 2.00 },
          { name: "Menma Bamboo Shoots", price: 1.50 },
        ]
      },
      {
        id: "shoyu-ramen",
        name: "Shoyu Ramen",
        description: "Clear soy-based broth, tender bamboo shoots, narutomaki, and scallions.",
        price: 17.00,
        category: "RAMEN",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: [
          { name: "Extra Chashu Pork", price: 3.00 },
          { name: "Ajitama Soft Boiled Egg", price: 2.00 },
          { name: "Menma Bamboo Shoots", price: 1.50 },
        ]
      },
      {
        id: "spicy-miso-ramen",
        name: "Spicy Miso Ramen",
        description: "Fermented soybean paste broth with a signature chili blend and sweet corn.",
        price: 18.00,
        category: "RAMEN",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: [
          { name: "Extra Chashu Pork", price: 3.00 },
          { name: "Ajitama Soft Boiled Egg", price: 2.00 },
          { name: "Menma Bamboo Shoots", price: 1.50 },
        ]
      },
      {
        id: "seafood-ramen",
        name: "Seafood Ramen",
        description: "Dashi-based broth with mussels, clams, shrimp, and seasonal seafood.",
        price: 20.00,
        category: "RAMEN",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: [
          { name: "Extra Chashu Pork", price: 3.00 },
          { name: "Ajitama Soft Boiled Egg", price: 2.00 },
          { name: "Menma Bamboo Shoots", price: 1.50 },
        ]
      },
      {
        id: "vegetable-ramen",
        name: "Vegetable Ramen",
        description: "Rich mushroom and kelp broth served with seasonal roasted vegetables.",
        price: 16.00,
        category: "RAMEN",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: [
          { name: "Ajitama Soft Boiled Egg", price: 2.00 },
          { name: "Menma Bamboo Shoots", price: 1.50 },
        ]
      },
    ]
  },
  {
    id: "sushi-rolls",
    title: "Sushi & Rolls",
    subtitle: "Fresh Cuts",
    items: [
      {
        id: "salmon-nigiri",
        name: "Salmon Nigiri",
        description: "Two pieces of premium Atlantic salmon over seasoned rice.",
        price: 8.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "tuna-nigiri",
        name: "Tuna Nigiri",
        description: "Fresh Bluefin tuna slices on hand-pressed rice beds.",
        price: 10.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "avocado-roll",
        name: "Avocado Roll",
        description: "Ripe avocado with toasted sesame seeds and seaweed wrap.",
        price: 10.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "cucumber-roll",
        name: "Cucumber Roll",
        description: "Crisp cucumber sticks, a refreshing vegetarian classic.",
        price: 9.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "spicy-tuna-roll",
        name: "Spicy Tuna Roll",
        description: "Chopped tuna tossed in spicy mayo with cucumber.",
        price: 14.00,
        category: "STARTER",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: []
      },
      {
        id: "dragon-roll",
        name: "Dragon Roll",
        description: "Shrimp tempura topped with thin slices of avocado and eel sauce.",
        price: 16.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "vegetable-roll",
        name: "Vegetable Roll",
        description: "Asparagus, cucumber, avocado, and pickled radish.",
        price: 12.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
      {
        id: "rainbow-roll",
        name: "Rainbow Roll",
        description: "California roll topped with assorted fresh sashimi pieces.",
        price: 18.00,
        category: "STARTER",
        spiceLevels: [],
        extras: []
      },
    ]
  },
  {
    id: "rice-dishes",
    title: "Rice Dishes",
    subtitle: null,
    items: [
      {
        id: "chicken-teriyaki-don",
        name: "Chicken Teriyaki Don",
        description: "Grilled chicken glazed in sweet teriyaki sauce, served over steamed rice.",
        price: 18.00,
        category: "RICE",
        spiceLevels: [],
        extras: []
      },
      {
        id: "salmon-teriyaki-don",
        name: "Salmon Teriyaki Don",
        description: "Pan-seared salmon with teriyaki glaze on a bed of warm rice.",
        price: 20.00,
        category: "RICE",
        spiceLevels: [],
        extras: []
      },
      {
        id: "unagi-don",
        name: "Unagi Don",
        description: "Grilled eel brushed with rich eel sauce, served over rice.",
        price: 22.00,
        category: "RICE",
        spiceLevels: [],
        extras: []
      },
      {
        id: "vegetable-don",
        name: "Vegetable Don",
        description: "Seasonal sautéed vegetables served over steamed rice with light seasoning.",
        price: 16.00,
        category: "RICE",
        spiceLevels: [],
        extras: []
      },
      {
        id: "japanese-curry-rice",
        name: "Japanese Curry Rice",
        description: "Savory Japanese curry with tender vegetables served over rice.",
        price: 17.00,
        category: "RICE",
        spiceLevels: ["None", "Mild", "Medium", "Extra Hot"],
        extras: []
      },
      {
        id: "garlic-fried-rice",
        name: "Garlic Fried Rice",
        description: "Fragrant fried rice tossed with garlic, egg, and light soy seasoning.",
        price: 14.00,
        category: "RICE",
        spiceLevels: [],
        extras: []
      },
    ]
  },
  {
    id: "desserts",
    title: "Desserts",
    subtitle: null,
    items: [
      {
        id: "matcha-tiramisu",
        name: "Matcha Tiramisu",
        description: "Layered dessert with matcha cream and delicate sponge, lightly sweetened.",
        price: 10.00,
        category: "DESSERT",
        spiceLevels: [],
        extras: []
      },
      {
        id: "mochi-ice-cream",
        name: "Mochi Ice Cream",
        description: "Soft rice cake filled with creamy ice cream in assorted flavors.",
        price: 9.00,
        category: "DESSERT",
        spiceLevels: [],
        extras: []
      },
      {
        id: "black-sesame-panna-cotta",
        name: "Black Sesame Panna Cotta",
        description: "Silky smooth panna cotta infused with rich black sesame flavor.",
        price: 11.00,
        category: "DESSERT",
        spiceLevels: [],
        extras: []
      },
      {
        id: "japanese-cheesecake",
        name: "Japanese Cheesecake",
        description: "Light and fluffy cheesecake with a delicate sweetness.",
        price: 10.00,
        category: "DESSERT",
        spiceLevels: [],
        extras: []
      },
      {
        id: "yuzu-sorbet",
        name: "Yuzu Sorbet",
        description: "Refreshing citrus sorbet with a bright and tangy yuzu flavor.",
        price: 8.00,
        category: "DESSERT",
        spiceLevels: [],
        extras: []
      },
    ]
  },
  {
    id: "beverages",
    title: "Beverages",
    subtitle: null,
    subsections: [
      {
        id: "juices",
        title: "Juices",
        items: [
          { id: "orange-juice", name: "Orange", description: "", price: 3.00, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "apple-juice", name: "Apple", description: "", price: 3.00, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "peach-juice", name: "Peach", description: "", price: 3.50, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "lychee-juice", name: "Lychee", description: "", price: 3.50, category: "DRINK", spiceLevels: [], extras: [] },
        ]
      },
      {
        id: "soft-drinks",
        title: "Soft Drinks",
        items: [
          { id: "coca-cola", name: "Coca-Cola", description: "", price: 2.50, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "diet-coke", name: "Diet Coke", description: "", price: 2.50, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "sprite", name: "Sprite", description: "", price: 2.50, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "ginger-ale", name: "Ginger Ale", description: "", price: 2.50, category: "DRINK", spiceLevels: [], extras: [] },
          { id: "iced-tea", name: "Iced Tea", description: "", price: 2.50, category: "DRINK", spiceLevels: [], extras: [] },
        ]
      }
    ],
    items: []
  }
];

export function findItemById(id) {
  for (const section of menuData) {
    if (section.items) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    if (section.subsections) {
      for (const sub of section.subsections) {
        const found = sub.items.find(i => i.id === id);
        if (found) return found;
      }
    }
  }
  return null;
}
