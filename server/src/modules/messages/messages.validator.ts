import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    subject: z.string()
      .min(3, 'Subject must be at least 3 characters')
      .max(100, 'Subject too long'),
    body: z.string()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message too long'),
  }),
});

export const replyMessageSchema = z.object({
  body: z.object({
    body: z.string()
      .min(1, 'Reply cannot be empty')
      .max(2000, 'Reply too long'),
  }),
});

export const messageQuerySchema = z.object({
  query: z.object({
    page: z.string().default('1'),
    limit: z.string().default('10'),
    isResolved: z.enum(['true', 'false']).optional(),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>['body'];
export type MessageQueryInput = z.infer<typeof messageQuerySchema>['query'];