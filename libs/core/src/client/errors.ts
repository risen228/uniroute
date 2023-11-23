export class FetchError extends Error {
  response: Response

  constructor(response: Response) {
    super('Fetch Error')
    this.response = response
  }
}

export class ServerException extends Error {
  response: Response

  constructor(response: Response) {
    super('Server Exception')
    this.response = response
  }
}

export class BrokenResponseError extends Error {
  constructor(reason: string) {
    super(`Broken Response - ${reason}`)
  }
}
