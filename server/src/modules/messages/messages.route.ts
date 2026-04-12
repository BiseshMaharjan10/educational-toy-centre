import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { verifyToken, verifyAdmin } from '../../middleware/auth';
import {
  sendMessageSchema,
  replyMessageSchema,
  messageQuerySchema,
} from './messages.validator';
import * as messagesController from './messages.controller';

const router = Router();

router.post(
  '/',
  verifyToken,
  validate(sendMessageSchema),
  messagesController.sendMessage
);

router.get(
  '/mine',
  verifyToken,
  validate(messageQuerySchema),
  messagesController.getUserMessages
);

router.get(
  '/mine/:id',
  verifyToken,
  messagesController.getUserMessageById
);

router.post(
  '/mine/:id/reply',
  verifyToken,
  validate(replyMessageSchema),
  messagesController.userReply
);

router.get(
  '/admin',
  verifyToken,
  verifyAdmin,
  validate(messageQuerySchema),
  messagesController.getAdminMessages
);

router.get(
  '/admin/:id',
  verifyToken,
  verifyAdmin,
  messagesController.getAdminMessageById
);

router.post(
  '/admin/:id/reply',
  verifyToken,
  verifyAdmin,
  validate(replyMessageSchema),
  messagesController.adminReply
);

router.patch(
  '/admin/:id/resolve',
  verifyToken,
  verifyAdmin,
  messagesController.markResolved
);

router.patch(
  '/admin/:id/read',
  verifyToken,
  verifyAdmin,
  messagesController.markRead
);

export default router;