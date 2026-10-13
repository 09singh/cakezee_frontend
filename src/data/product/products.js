export const products = [
  {
    id: "teddy-first-birthday",
    name: "Teddy First Birthday",
    category: "first-birthday",

    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",

    badge: "Popular",

    sizes: [
      {
        label: "0.5 kg",
        weight: 0.5,
      },
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "1.5 kg",
        weight: 1.5,
      },
      {
        label: "2 kg",
        weight: 2,
      },
      {
        label: "3 kg",
        weight: 3,
      },
    ],

    flavours: [
      {
        name: "Chocolate",
        basePrice: 250,
      },
      {
        name: "Butterscotch",
        basePrice: 280,
      },
      {
        name: "Red Velvet",
        basePrice: 300,
      },
      {
        name: "Pineapple",
        basePrice: 220,
      },
      {
        name: "Vanilla",
        basePrice: 200,
      },
      {
        name: "Oreo",
        basePrice: 280,
      },
    ],
  },

  {
    id: "pink-princess",
    name: "Pink Princess",
    category: "first-birthday",

    image:
      "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=900&q=85",

    badge: null,

    sizes: [
      {
        label: "0.5 kg",
        weight: 0.5,
      },
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "1.5 kg",
        weight: 1.5,
      },
    ],

    flavours: [
      {
        name: "Vanilla",
        basePrice: 220,
      },
      {
        name: "Strawberry",
        basePrice: 280,
      },
      {
        name: "Chocolate",
        basePrice: 250,
      },
    ],
  },

  {
    id: "jungle-safari",
    name: "Jungle Safari",
    category: "kids",

    image:
      "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=85",

    badge: null,

    sizes: [
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "1.5 kg",
        weight: 1.5,
      },
      {
        label: "2 kg",
        weight: 2,
      },
    ],

    flavours: [
      {
        name: "Chocolate",
        basePrice: 300,
      },
      {
        name: "Vanilla",
        basePrice: 250,
      },
      {
        name: "Butterscotch",
        basePrice: 280,
      },
    ],
  },

  {
    id: "rainbow-cake",
    name: "Rainbow Cake",
    category: "kids",

    image:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85",

    badge: null,

    sizes: [
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "1.5 kg",
        weight: 1.5,
      },
    ],

    flavours: [
      {
        name: "Vanilla",
        basePrice: 250,
      },
      {
        name: "Strawberry",
        basePrice: 300,
      },
    ],
  },

  {
    id: "mickey-cake",
    name: "Mickey Cake",
    category: "kids",

    image:
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=900&q=85",

    badge: null,

    sizes: [
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "2 kg",
        weight: 2,
      },
    ],

    flavours: [
      {
        name: "Chocolate",
        basePrice: 350,
      },
      {
        name: "Vanilla",
        basePrice: 300,
      },
    ],
  },

  {
    id: "princess-castle",
    name: "Princess Castle",
    category: "girls",

    image:
      "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=85",

    badge: null,

    sizes: [
      {
        label: "1 kg",
        weight: 1,
      },
      {
        label: "1.5 kg",
        weight: 1.5,
      },
    ],

    flavours: [
      {
        name: "Vanilla",
        basePrice: 300,
      },
      {
        name: "Strawberry",
        basePrice: 350,
      },
      {
        name: "Chocolate",
        basePrice: 325,
      },
    ],
  },
];

export function getProductById(id) {
  return products.find(
    (product) => product.id === id
  );
}

export function getProductsByCategory(category) {
  if (category === "all") {
    return products;
  }

  return products.filter(
    (product) => product.category === category
  );
}