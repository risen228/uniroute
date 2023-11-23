import { Validation } from '@uniroute/core'
import { createRoute, Json, StatusCode } from '@uniroute/core/server'
import { z, ZodSchema, ZodTypeDef } from 'zod'
import { getUser } from '../hooks/user'

function zodValidation<
  TPayload,
  TTransformed = TPayload,
  TDef extends ZodTypeDef = ZodTypeDef,
>(
  schema: ZodSchema<TTransformed, TDef, TPayload>,
): Validation<TPayload, TTransformed> {
  return {
    fn(payload) {
      return schema.parseAsync(payload)
    },
  }
}

export const sayHello = createRoute({
  method: 'GET',
  validation: {
    payload: zodValidation(
      z.object({
        name: z.string().optional(),
      }),
    ),
  },
  async handler({ payload }) {
    return Json(200, { message: `Hello, ${payload.name ?? 'stranger'}!` })
  },
})

export const getMe = createRoute({
  method: 'GET',
  async handler() {
    const user = await getUser()
    return Json(200, user)
  },
})

export const deleteMe = createRoute({
  method: 'DELETE',
  async handler() {
    const user = await getUser()

    console.log(`User ${user.profile?.firstName} deleted!`)

    return StatusCode(204)
  },
})
