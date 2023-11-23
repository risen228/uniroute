import { deleteMe, getMe, sayHello } from './users'

export const routes = {
  sayHello,
  users: {
    getMe,
    deleteMe,
  },
}
