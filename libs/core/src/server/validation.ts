import { ZodSchema, ZodTypeDef } from 'zod'
import { ValidationException } from '../exceptions'

export async function validate<
  TInput = void,
  TOutput = void,
  TTransformed = TOutput,
  TDef extends ZodTypeDef = ZodTypeDef,
>(
  data: unknown,
  schema: ZodSchema<TTransformed, TDef, TInput>,
): Promise<TTransformed> {
  const validation = await schema.safeParseAsync(data)

  if (!validation.success) {
    throw new ValidationException(validation.error)
  }

  return validation.data
}
