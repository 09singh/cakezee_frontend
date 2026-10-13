export const Readynow = [
  {
    id: "teddy-first-birthday",
    name: "Teddy First Birthday",
    category: "first-birthday",
    price: 999,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",
    badge: "Popular",

    sizes: [
      {
        label: "0.5 kg",
        price: 999,
      },
      {
        label: "1 kg",
        price: 1199,
      },
      {
        label: "1.5 kg",
        price: 1399,
      },
      {
        label: "2 kg",
        price: 1699,
      },
      {
        label: "3 kg+",
        price: 2199,
      },
    ],

    flavours: [
      "Chocolate",
      "Butterscotch",
      "Red Velvet",
      "Pineapple",
      "Vanilla",
      "Oreo",
    ],
  },

  {
    id: "pink-princess",
    name: "Pink Princess",
    category: "first-birthday",
    price: 1199,
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=900&q=85",
    badge: null,

    sizes: [
      {
        label: "0.5 kg",
        price: 1199,
      },
      {
        label: "1 kg",
        price: 1399,
      },
      {
        label: "1.5 kg",
        price: 1599,
      },
    ],

    flavours: [
      "Vanilla",
      "Strawberry",
      "Chocolate",
    ],
  },

  {
    id: "jungle-safari",
    name: "Jungle Safari",
    category: "kids",
    price: 1299,
    image: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=85",
    badge: null,

    sizes: [
      {
        label: "1 kg",
        price: 1299,
      },
      {
        label: "1.5 kg",
        price: 1499,
      },
      {
        label: "2 kg",
        price: 1799,
      },
    ],

    flavours: [
      "Chocolate",
      "Vanilla",
      "Butterscotch",
    ],
  },

  {
    id: "rainbow-cake",
    name: "Rainbow Cake",
    category: "kids",
    price: 999,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85",
    badge: null,

    sizes: [
      {
        label: "1 kg",
        price: 999,
      },
      {
        label: "1.5 kg",
        price: 1299,
      },
    ],

    flavours: [
      "Vanilla",
      "Strawberry",
    ],
  },

  {
    id: "mickey-cake",
    name: "Mickey Cake",
    category: "kids",
    price: 1499,
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=900&q=85",
    badge: null,

    sizes: [
      {
        label: "1 kg",
        price: 1499,
      },
      {
        label: "2 kg",
        price: 1999,
      },
    ],

    flavours: [
      "Chocolate",
      "Vanilla",
    ],
  },

  {
    id: "princess-castle",
    name: "Princess Castle",
    category: "girls",
    price: 1199,
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=85",
    badge: null,

    sizes: [
      {
        label: "1 kg",
        price: 1199,
      },
      {
        label: "1.5 kg",
        price: 1499,
      },
    ],

    flavours: [
      "Vanilla",
      "Strawberry",
      "Chocolate",
    ],
  },
];

export function getReadynowById(id) {
  return Readynow.find(
    (product) => product.id === id
  );
}

export function getReadynowByCategory(category) {
  if (category === "all") {
    return Readynow;
  }

  return Readynow.filter(
    (product) => product.category === category
  );
}