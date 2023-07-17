//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//// NEEDS UPDATING!!!!!
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


const { User, questionSchema } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
i
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('questions');
                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
        // in progress -- syntax needs checking
        getQuizQuestions: async (parent, args, context) => {
            if (context.user) {
                const quizData = await Quiz.find({ _id: quizID })
                    .populate('questions');
                return quizData;
            }

            throw new AuthenticationError('Not logged in');
        },
        // in progress -- syntax needs checking
        getQuizzesPlayed: async (parent, args, context) => {
            if (context.user) {
                const quizData = await Quiz.find({ _id: args.playerID })
                    .populate('quizzesPlayed');
                return quizData;
            }

            throw new AuthenticationError('Not logged in');
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { input }, context) => {
            const updatedBookUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { savedBooks: input } },
                { new: true, runValidators: true }
            );
            return updatedBookUser;
        },
        removeBook: async (parent, { bookId }, context) => {
            const updatedBookUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            );
            return updatedBookUser;
        },

        // ADD QUIZ -- in progress
        addQuiz: async (parent, args, context) => {
            if (context.user) {
                const quiz = await Quiz.create(args);

                return { quiz };
            }
        },
        // ADD QUESTION -- in progress
        addQuestion: async (parent, args, context) => {
            if (context.user) {
                const question = await questionSchema.create(args);

                return Quiz.findOneAndUpdate(
                    { _id: args.quizID },
                    {
                        $addToSet: { questions: question._id },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );
            }
        },
    }
};

module.exports = resolvers;