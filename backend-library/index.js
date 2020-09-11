const {
  ApolloServer,
  UserInputError,
  gql,
  AuthenticationError
} = require("apollo-server");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/User");

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
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

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
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Book

    deleteBook(title: String!): String
    editAuthor(name: String!, setBornTo: Int): Author

    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const { PubSub } = require("apollo-server");
const pubsub = new PubSub();

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
          genres: { $in: [args.genre] }
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

    me: (root, arg, { currentUser }) => currentUser
  },

  Mutation: {
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError("not authenticated");
      }
      try {
        const query = { name: args.name };
        const author = await Author.findOneAndUpdate(query, {
          born: args.setBornTo
        });
        return author;
      } catch (error) {
        throw new UserInputError("error updating author");
      }
    },

    addBook: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }

      if (args.title.length < 4 || args.author.length < 4)
        throw new UserInputError(
          "titles and author names must be at least 4 characters long"
        );
      if (
        !(
          args.title ||
          args.author ||
          args.publishe ||
          args.genres ||
          args.author
        )
      )
        throw new UserInputError(
          "books require a: title, author, published (date) and genres: ['list of genres']"
        );
      try {
        const author = await createAuthorIfOneDoenstExist(args.author);
        let bookArgs = { ...args };
        bookArgs.author = author;

        const book = new Book(bookArgs);
        book.save();

        pubsub.publish("BOOK_ADDED", { bookAdded: book });

        return book;
      } catch (error) {
        throw new UserInputError("error creating book");
      }
    },

    deleteBook: async (root, args) => {
      try {
        const book = await Book.findOne({ title: args.title });
        if (book) {
          await Book.deleteOne({ title: book.title });
          return `${args.title} was deleted`;
        }
        return "book not found";
      } catch (error) {
        throw new UserInputError("error deleting book");
      }
    },

    // user and login/ logout mutations
    createUser: async (root, args) => {
      const user = new User({ ...args });
      try {
        await user.save();
      } catch (error) {
        throw new UserInputError(
          "error creating user. username must be unique"
        );
      }
      return user;
    },

    login: async (root, args) => {
      try {
        const user = await User.findOne({ username: args.username });
        if (!user || args.password !== "password")
          throw new UserInputError("incorrect username or password");

        const tokenForUser = { username: user.username, id: user._id };
        return { value: jwt.sign(tokenForUser, JWT_SECRET) };
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        });
      }
    }
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"])
    }
  }
};

// helper functions for queries and mutations
const createAuthorIfOneDoenstExist = async name => {
  const author = await Author.find({ name: name });
  if (author.length > 0) return author[0];
  else {
    let newAuthor = new Author({ name, born: null });
    try {
      newAuthor.save();
      return newAuthor;
    } catch (error) {
      throw new UserInputError("error creating new author");
    }
  }
};

/* initialize library using json data */
/*
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
*/
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  }
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
