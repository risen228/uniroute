import { ClientMetadata } from './types'

export interface SayHelloPayload {
  name?: string
}

export interface SayHelloOutput {
  message: string
  test: string
}

export interface UsersGetMeOutput {
  user: unknown
}

export interface ClientTree {
  sayHello: {
    payload: SayHelloPayload
    output: SayHelloOutput
  }
  users: {
    getMe: {
      payload: void
      output: UsersGetMeOutput
    }
  }
}

export const metadata: ClientMetadata<ClientTree> = [
  {
    $uniroute: 'metadata',
    parentPath: [],
    name: 'sayHello',
    path: 'sayHello',
    method: 'GET',
  },
  {
    $uniroute: 'metadata',
    parentPath: ['users'],
    name: 'getMe',
    path: 'users_getMe',
    method: 'GET',
  },
]
