import { User } from '@example/model'

export async function getUser(): Promise<User> {
  return {
    id: '1',
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01',
    profile: {
      firstName: 'John',
      lastName: 'Smith',
    },
    accounts: [
      {
        provider: 'google',
        providerUserName: 'johnsmith',
        providerUserImage: 'https://example.com/johnsmith.png',
      },
    ],
  }
}
