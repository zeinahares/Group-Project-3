const { User, Quiz, Question } = require('../models');
const { AuthenticationError } = require('apollo-server-express');

const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id })
                    .populate('createdQuizzes')
                    .populate('playedQuizzes');
            }

            throw new AuthenticationError('Not logged in');
        },


        getQuizQuestions: async (parent, { quizId }, context) => {
            if (context.user) {
                const quizData = await Quiz.find({ _id: quizId })
                    .populate('questions');
                return quizData;
            }

            throw new AuthenticationError('Not logged in');
        },

        getPlayedQuizzes: async (parent, args, context) => {
            if (context.user) {
                const quizData = await User.find({ _id: context.user._id })
                    .populate('playedQuizzes');
                return quizData;
            }

            throw new AuthenticationError('Not logged in');
        },

        // gets a list of all quizes from the db
        dbQuizzes: async (parent, args, context) => {
            const quizData = await Quiz.find({})
            return quizData;
        },

        getLeaderboard: async (parent, { quizId }, context) => {
            if (context.user) {
                const quizData = await Quiz.find({ _id: quizId })
                    .populate('leaderboard');
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

        addQuiz: async (parent, { input }, context) => {
            if (context.user) {
                return await Quiz.create(
                    {
                        quizAuthor: context.user._id,
                        description: input.description,
                        title: input.title,
                        imgURL: input.imgURL,
                    });

            }
            throw new AuthenticationError('You need to be logged in!');
        },

        addQuestion: async (parent, { quizId, input }, context) => {
            if (context.user) {
                const question = await Question.create(
                    {
                        questionText: input.questionText,
                        timeLimit: input.timeLimit,
                        correctAnswer: input.correctAnswer,
                        answers: input.answers
                    });

                return Quiz.findOneAndUpdate(
                    { _id: quizId },
                    {
                        $addToSet: { questions: question._id },
                    },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        addLeaderboard: async (parent, { quizId, points }, context) => {
            if (context.user) {
                User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { playedQuizzes: quizId } },
                    {
                        new: true,
                        runValidators: true,
                    }
                )
                return Quiz.findOneAndUpdate(
                    { _id: quizId },
                    {
                        $addToSet: {
                            leaderboard: { points, playerId: context.user._id },
                        },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        removeQuiz: async (parent, { quizId }, context) => {
            if (context.user) {
                User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { createdQuizzes: quizId } }
                );

                User.findSeveralAndUpdate(
                    { playedQuizzes: quizId },
                    { $pull: { playedQuizzes: quizId } }
                );

                Question.deleteMany({ quizId });

                return Quiz.findOneAndDelete({ _id: quizId });
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        removeQuestion: async (parent, { quizId, questionId }, context) => {
            if (context.user) {

                Question.findOneAndDelete({ _id: questionId });

                return Quiz.findOneAndUpdate(
                    { _id: quizId },
                    { $pull: { questions: { _id: questionId } } },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        editQuizDetails: async (parent, { quizId, input }, context) => {
            if (context.user) {
                return Quiz.findOneAndUpdate(
                    { _id: quizId },
                    {
                        title: input.title,
                        description: input.description,
                        imgURL: input.imgURL
                    },
                    { new: true }
                );
            }

            throw new AuthenticationError('You need to be logged in!');
        },

        editQuestion: async (parent, { questionId, input }, context) => {
            if (context.user) {
                return await Question.findOneAndUpdate(
                    { _id: questionId },
                    {
                        questionText: input.questionText,
                        timeLimit: input.timeLimit,
                        answers: input.answers,
                        correctAnswer: input.correctAnswer,
                    },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;