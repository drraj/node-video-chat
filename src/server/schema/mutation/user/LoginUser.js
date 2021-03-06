import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
} from 'graphql';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

const LoginResponse = new GraphQLObjectType({
  name: 'LoginResponse',
  fields: {
    success: { type: GraphQLBoolean },
    message: { type: GraphQLString },
    token: { type: GraphQLString },
  },
});

export default {
  type: LoginResponse,
  name: 'LoginUser',
  args: {
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  },
  async resolve(parent, { email, password }, req) {
    try {
      const user = await models.user.findOne({
        where: {
          [Op.or]: [
            { email: { $iLike: email } },
            { username: { $iLike: email } },
          ],
        },
      });
      if (!user) return { success: false, message: 'No user with that email' };
      if (!(await user.validatePassword(password))) return { success: false, message: 'Invalid email/password' };
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 24 * 60 * 60 });
      req.cookies.set(process.env.COOKIE_KEY, token, { signed: true, maxAge: Date.now() + (24 * 60 * 60 * 1e3) });
      return {
        success: true,
        message: 'success',
        token,
      };
    } catch (err) {
      console.log(err);
      return { success: false, message: 'Something went wrong logging you in' };
    }
  },
};
