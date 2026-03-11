require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");

const questions = [
  {
    questionText: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "What is the largest ocean on Earth?",
    options: [
      "Atlantic Ocean",
      "Indian Ocean",
      "Arctic Ocean",
      "Pacific Ocean",
    ],
    correctAnswerIndex: 3,
    timeLimit: 20,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "Who painted the Mona Lisa?",
    options: [
      "Vincent van Gogh",
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Michelangelo",
    ],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Art",
    difficulty: "easy",
  },
  {
    questionText: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    correctAnswerIndex: 2,
    timeLimit: 15,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "History",
    difficulty: "medium",
  },
  {
    questionText: "Which element has the atomic number 1?",
    options: ["Helium", "Hydrogen", "Oxygen", "Carbon"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "What is the longest river in the world?",
    options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Geography",
    difficulty: "medium",
  },
  {
    questionText: "Who wrote 'Romeo and Juliet'?",
    options: [
      "Charles Dickens",
      "William Shakespeare",
      "Jane Austen",
      "Mark Twain",
    ],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Literature",
    difficulty: "easy",
  },
  {
    questionText: "What is the speed of light in km/s (approximately)?",
    options: ["100,000 km/s", "200,000 km/s", "300,000 km/s", "400,000 km/s"],
    correctAnswerIndex: 2,
    timeLimit: 25,
    category: "Science",
    difficulty: "medium",
  },
  {
    questionText: "Which country has the largest population?",
    options: ["India", "United States", "China", "Indonesia"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Geography",
    difficulty: "medium",
  },
  {
    questionText: "Who discovered penicillin?",
    options: [
      "Marie Curie",
      "Alexander Fleming",
      "Louis Pasteur",
      "Isaac Newton",
    ],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Science",
    difficulty: "medium",
  },
  {
    questionText: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctAnswerIndex: 2,
    timeLimit: 15,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "How many bones are in the adult human body?",
    options: ["186", "206", "226", "246"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Science",
    difficulty: "medium",
  },
  {
    questionText: "Which planet is the largest in our solar system?",
    options: ["Saturn", "Neptune", "Jupiter", "Uranus"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "Who was the first person to walk on the Moon?",
    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "History",
    difficulty: "easy",
  },
  {
    questionText: "What is the main ingredient in guacamole?",
    options: ["Tomato", "Avocado", "Onion", "Lime"],
    correctAnswerIndex: 1,
    timeLimit: 15,
    category: "Food",
    difficulty: "easy",
  },
  {
    questionText: "Which gas do plants absorb from the atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "What is the currency of the United Kingdom?",
    options: ["Euro", "Dollar", "Pound Sterling", "Franc"],
    correctAnswerIndex: 2,
    timeLimit: 15,
    category: "General",
    difficulty: "easy",
  },
  {
    questionText: "Which animal is known as the 'King of the Jungle'?",
    options: ["Tiger", "Elephant", "Lion", "Gorilla"],
    correctAnswerIndex: 2,
    timeLimit: 15,
    category: "Animals",
    difficulty: "easy",
  },
  {
    questionText: "What is the tallest mountain in the world?",
    options: ["K2", "Mount Everest", "Kangchenjunga", "Mount Kilimanjaro"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Geography",
    difficulty: "easy",
  },
  {
    questionText: "In which year did the Titanic sink?",
    options: ["1910", "1912", "1914", "1916"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "History",
    difficulty: "medium",
  },
  {
    questionText: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Science",
    difficulty: "easy",
  },
  {
    questionText: "Which organ in the human body produces insulin?",
    options: ["Liver", "Kidney", "Pancreas", "Heart"],
    correctAnswerIndex: 2,
    timeLimit: 25,
    category: "Science",
    difficulty: "medium",
  },
  {
    questionText: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctAnswerIndex: 2,
    timeLimit: 20,
    category: "Geography",
    difficulty: "medium",
  },
  {
    questionText: "Who invented the telephone?",
    options: [
      "Thomas Edison",
      "Alexander Graham Bell",
      "Nikola Tesla",
      "Guglielmo Marconi",
    ],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "History",
    difficulty: "medium",
  },
  {
    questionText: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswerIndex: 1,
    timeLimit: 20,
    category: "Animals",
    difficulty: "easy",
  },
  {
    questionText: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctAnswerIndex: 1,
    timeLimit: 15,
    category: "Math",
    difficulty: "easy",
  },
];

async function seedQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing questions (optional)
    await Question.deleteMany({});
    console.log("Cleared existing questions");

    // Insert new questions
    const result = await Question.insertMany(questions);
    console.log(`Successfully added ${result.length} questions!`);

    console.log("\nQuestions by category:");
    const categories = [...new Set(questions.map((q) => q.category))];
    categories.forEach((cat) => {
      const count = questions.filter((q) => q.category === cat).length;
      console.log(`  ${cat}: ${count}`);
    });

    mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error seeding questions:", error.message);
    process.exit(1);
  }
}

seedQuestions();
