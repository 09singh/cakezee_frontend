export const categories = [
  {
    id: "birthday",
    name: "1st Birthday",
    slug: "first-birthday",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "kids",
    name: "Kids",
    slug: "kids",
    image: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "anniversary",
    name: "Anniversary",
    slug: "anniversary",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "wedding",
    name: "Wedding",
    slug: "wedding",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "engagement",
    name: "Engagement",
    slug: "engagement",
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "baby-shower",
    name: "Baby Shower",
    slug: "baby-shower",
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "boys",
    name: "Boys",
    slug: "boys",
    image: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "girls",
    name: "Girls",
    slug: "girls",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "couple",
    name: "Couple",
    slug: "couple",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "mom",
    name: "Mom",
    slug: "mom",
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "dad",
    name: "Dad",
    slug: "dad",
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "corporate",
    name: "Corporate",
    slug: "corporate",
    image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    image: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "teachers",
    name: "Teachers",
    slug: "teachers",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
  },

  {
    id: "bachelorette",
    name: "Bachelorette",
    slug: "bachelorette",
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=400&q=80",
  },
];

export function getCategoriesByID(id) {
  return categories.find(
    (category) => category.id === id
  );
}

export function getProductsByCategory(category) {
  if (category === "all") {
    return categories;
  }

  return categories.filter(
    (cat) => cat.slug === category
  );
}