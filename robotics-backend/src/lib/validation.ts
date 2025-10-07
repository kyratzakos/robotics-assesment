import { z } from 'zod'

const coord = z.object({ x: z.number(), y: z.number(), z: z.number() })

export const taskSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pick'),  from: coord }),
  z.object({ type: z.literal('place'), to:   coord }),
])

export const createStackBodySchema = z.object({
  deviceId: z.string().optional(),
  tasks: z.array(taskSchema).min(1, 'tasks cannot be empty'),
})
