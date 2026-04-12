import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import * as messagesService from './messages.service';
import type {
  SendMessageInput,
  ReplyMessageInput,
  MessageQueryInput,
} from './messages.validator';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await messagesService.sendMessage(
    userId,
    req.body as SendMessageInput
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: result.message,
    data: { messageId: result.messageId },
  });
});

export const getUserMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await messagesService.getUserMessages(
    userId,
    req.query as unknown as MessageQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getUserMessageById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const messageId = req.params.id as string;
  const message = await messagesService.getUserMessageById(messageId, userId);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { message },
  });
});

export const getAdminMessages = asyncHandler(async (req: Request, res: Response) => {
  const result = await messagesService.getAdminMessages(
    req.query as unknown as MessageQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getAdminMessageById = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id as string;
  const message = await messagesService.getAdminMessageById(messageId);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { message },
  });
});

export const adminReply = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id as string;
  const reply = await messagesService.replyToMessage(
    messageId,
    'ADMIN',
    req.body as ReplyMessageInput
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Reply sent successfully',
    data: { reply },
  });
});

export const userReply = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const messageId = req.params.id as string;
  const reply = await messagesService.replyToMessage(
    messageId,
    'USER',
    req.body as ReplyMessageInput,
    userId
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Reply sent successfully',
    data: { reply },
  });
});

export const markResolved = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id as string;
  const result = await messagesService.markMessageResolved(messageId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id as string;
  const result = await messagesService.markMessageRead(messageId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});