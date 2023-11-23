export interface Profile {
  firstName: string
  lastName: string
}

export interface Account {
  provider: string
  providerUserName: string
  providerUserImage: string
}

export interface User {
  id: string
  createdAt: string
  updatedAt: string
  profile: Profile | null
  accounts: Account[]
}
