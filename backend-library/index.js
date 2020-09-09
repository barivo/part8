const {
  ApolloServer,
  UserInputError,
  gql,
  AuthenticationError,
} = require("apollo-server");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Author = require("./models/author");
const Book = require("./models/book");

const { booksdata, authorsdata } = require("./data");
const author = require("./models/author");

mongoose.set("useFindAndModify", false);

const MONGODB_URI =
  "mongodb+srv://fullstack:fooboo@cluster0.oe8mf.mongodb.net/<dbname>?retryWrites=true&w=majority";

const JWT_SECRET = "NEED_HERE_A_SECRET_KEY";

mongoose.set("useCreateIndex", true);

console.log("connecting to", MONGODB_URI);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch(error => {
    console.log("error connection to MongoDB:", error.message);
  });

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Query {
    allBooks(author: String, genre: String): [Book!]
    allAuthors: [Author!]
    bookCount: Int!
    authorCount: Int!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Book

    editAuthor(name: String!, born: Int): Author
  }
`;

const resolvers = {
  Query: {
    allBooks: async (root, args) => {
      if (!args.author && !args.genre)
        return await Book.find().populate("author");
      else if (!args.author && args.genre) {
        return await Book.find({ genres: { $in: [args.genre] } }).populate(
          "author"
        );
      }

      if (args.author && !args.genre) {
        const books = await Book.find().populate({ path: "author" });
        return books.filter(b => b.author.name === args.author);
      } else if (args.author && args.genre) {
        const books = await Book.find({
          genres: { $in: [args.genre] },
        }).populate("author");
        return books.filter(b => b.author.name === args.author);
      }
    },

    allAuthors: async () => {
      const books = await Book.find({}).populate("author");
      return await Author.find({}).map(a => {
        bookCount: books.filter(b => b.author.name === a.name).length;
        return a;
      });
    },

    bookCount: () => Book.collection.count(),

    authorCount: () => Author.collection.count(),
  },

  Mutation: {
    addBook: async (root, args) => {
      const book = new Book(args);
      console.log(book);
    },
  },
};

const initLibrary = async () => {
  let authors = await Author.find({});
  if (!authors.length > 0) {
    const authorsArray = authorsdata.map(a => new Author(a));
    const promisesArr = authorsArray.map(a => a.save());
    await Promise.all(promisesArr);
  }

  const books = await Book.find({});
  if (!books.length > 0) {
    authors = await Author.find({});

    const booksArray = booksdata.map(b => {
      const author = authors.find(a => a.name === b.author);
      b.author = author;
      return new Book(b);
    });

    const promisesArr = booksArray.map(b => b.save());
    await Promise.all(promisesArr);
  }
};

initLibrary();
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
