import { Validation } from '@uniroute/core'
import { ZodSchema, ZodTypeDef } from 'zod'

export function zodValidation<
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
