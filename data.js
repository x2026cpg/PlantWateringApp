const STARTUP = {
  name: "Sproutkeeper",
  tagline: "A little care, right on time.",
  pitch: "Keep every plant thriving with a simple watering schedule that fits your day."
};

const SEED_PLANTS = [
  {
    id: "plant-pothos",
    name: "Golden pothos",
    variety: "Epipremnum aureum",
    location: "Living room",
    intervalDays: 7,
    daysSinceWatered: 9,
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "plant-monstera",
    name: "Monstera",
    variety: "Monstera deliciosa",
    location: "Bright corner",
    intervalDays: 7,
    daysSinceWatered: 7,
    image: "https://images.unsplash.com/photo-1614594895304-fe7116ac3b4d?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "plant-bird-of-paradise",
    name: "Bird of paradise",
    variety: "Strelitzia nicolai",
    location: "Sunroom",
    intervalDays: 7,
    daysSinceWatered: 5,
    image: "https://images.unsplash.com/photo-1597055181300-a8a3c4f2e7a5?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "plant-snake",
    name: "Snake plant",
    variety: "Dracaena trifasciata",
    location: "Bedroom",
    intervalDays: 21,
    daysSinceWatered: 18,
    image: "https://images.unsplash.com/photo-1593691509543-c55fb32e5cee?auto=format&fit=crop&w=240&q=80"
  }
];

const SEED_GROUP = {
  name: "Living room crew",
  members: ["You", "Mia", "Leo", "Sam"],
  reminders: [
    {
      id: "reminder-seed-1",
      from: "Mia",
      to: "You",
      plantId: "plant-monstera",
      message: "Could you check the soil? It may be thirsty.",
      daysAgo: 0,
      status: "pending"
    },
    {
      id: "reminder-seed-2",
      from: "You",
      to: "Leo",
      plantId: "plant-pothos",
      message: "The pothos is ready for a drink.",
      daysAgo: 1,
      status: "pending"
    }
  ]
};
