export interface SerializedException {
  $uniroute: 'exception'
  name: string
  status: number
  payload?: unknown
}
