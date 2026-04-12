import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { sendEmail } from '../../config/email';
import type {
  SendMessageInput,
  ReplyMessageInput,
  MessageQueryInput,
} from './messages.validator';

export const sendMessage = async (userId: string, data: SendMessageInput) => {
  const message = await prisma.message.create({
    data: {
      userId,
      subject: data.subject,
      body: data.body,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { email: true },
  });

  if (admin?.email) {
    await sendEmail(
      admin.email,
      `New message from ${message.user.name} — Educational Toy Centre`,
      newMessageTemplate(
        message.user.name,
        message.user.email,
        message.subject,
        message.body,
        message.id
      )
    );
  }

  return {
    message: 'Message sent successfully. We will get back to you soon.',
    messageId: message.id,
  };
};

export const getUserMessages = async (
  userId: string,
  query: MessageQueryInput
) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '10');
  const skip = (page - 1) * limit;

  const where: { userId: string; isResolved?: boolean } = { userId };
  if (query.isResolved !== undefined) {
    where.isResolved = query.isResolved === 'true';
  }

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserMessageById = async (
  messageId: string,
  userId: string
) => {
  const message = await prisma.message.findFirst({
    where: { id: messageId, userId },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!message) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  return message;
};

export const getAdminMessages = async (query: MessageQueryInput) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '10');
  const skip = (page - 1) * limit;

  const where: { isResolved?: boolean } = {};
  if (query.isResolved !== undefined) {
    where.isResolved = query.isResolved === 'true';
  }

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.message.count({ where }),
  ]);

  const unreadCount = await prisma.message.count({
    where: { isRead: false, isResolved: false },
  });

  return {
    messages,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminMessageById = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      user: { select: { name: true, email: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!message) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  if (!message.isRead) {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  return message;
};

export const replyToMessage = async (
  messageId: string,
  senderRole: 'USER' | 'ADMIN',
  data: ReplyMessageInput,
  userId?: string
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!message) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  if (senderRole === 'USER' && message.userId !== userId) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  if (message.isResolved) {
    throw new AppError(
      'Cannot reply to a resolved message',
      StatusCodes.BAD_REQUEST
    );
  }

  const reply = await prisma.messageReply.create({
    data: {
      messageId,
      senderRole,
      body: data.body,
    },
  });

  if (senderRole === 'ADMIN') {
    await sendEmail(
      message.user.email,
      `Reply to your message — Educational Toy Centre`,
      adminReplyTemplate(
        message.user.name,
        message.subject,
        data.body
      )
    );
  }

  return reply;
};

export const markMessageResolved = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isResolved: true },
  });

  return { message: 'Message marked as resolved' };
};

export const markMessageRead = async (messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError('Message not found', StatusCodes.NOT_FOUND);
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });

  return { message: 'Message marked as read' };
};

const newMessageTemplate = (
  senderName: string,
  senderEmail: string,
  subject: string,
  body: string,
  messageId: string
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1A2F4A;">New Message Received</h2>
    <div style="background: #F5C518; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="color: #1A2F4A; margin: 0;">${subject}</h3>
    </div>
    <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;">${body}</p>
    </div>
    <p style="color: #666; font-size: 14px;">Message ID: ${messageId}</p>
    <p style="color: #666;">Log in to your admin panel to reply.</p>
  </div>
`;

const adminReplyTemplate = (
  customerName: string,
  subject: string,
  replyBody: string
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1A2F4A;">You have a new reply</h2>
    <p>Hi ${customerName},</p>
    <p>Educational Toy Centre has replied to your message: <strong>${subject}</strong></p>
    <div style="background: #F5C518; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; color: #1A2F4A;">${replyBody}</p>
    </div>
    <p>Log in to your account to continue the conversation.</p>
    <p>— Educational Toy Centre Team</p>
  </div>
`;