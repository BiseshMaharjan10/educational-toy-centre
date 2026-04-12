import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { sendEmail } from '../../config/email';
import type {
  PlaceOrderInput,
  UpdateOrderStatusInput,
  OrderQueryInput,
} from './orders.validator';

export const placeOrder = async (userId: string, data: PlaceOrderInput) => {
  const productIds = data.items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      'One or more products are unavailable',
      StatusCodes.BAD_REQUEST
    );
  }

  const stockErrors: string[] = [];
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (product.stock < item.quantity) {
      stockErrors.push(
        `"${product.name}" only has ${product.stock} in stock but you requested ${item.quantity}`
      );
    }
  }

  if (stockErrors.length > 0) {
    throw new AppError(stockErrors.join('. '), StatusCodes.BAD_REQUEST);
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        deliveryAddress: data.deliveryAddress,
        specialInstructions: data.specialInstructions,
        status: 'PENDING',
        items: {
          create: data.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.price,
            };
          }),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return newOrder;
  });

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { email: true },
  });

  if (admin?.email) {
    const itemsList = order.items
      .map((item) => `${item.product.name} x${item.quantity} — NPR ${item.unitPrice}`)
      .join('\n');

    await sendEmail(
      admin.email,
      `New Order #${order.id.slice(0, 8).toUpperCase()} — Educational Toy Centre`,
      newOrderNotificationTemplate(
        order.user.name,
        order.user.email,
        order.id,
        itemsList,
        data.deliveryAddress
      )
    );
  }

  return {
    message: 'Order placed successfully. The owner will contact you to confirm.',
    orderId: order.id,
    status: order.status,
  };
};

export const getUserOrders = async (userId: string, query: OrderQueryInput) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '10');
  const skip = (page - 1) * limit;

  const where: { userId: string; status?: any } = { userId };
  if (query.status) where.status = query.status;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, images: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserOrderById = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, images: true, slug: true, price: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', StatusCodes.NOT_FOUND);
  }

  return order;
};

export const cancelUserOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('Order not found', StatusCodes.NOT_FOUND);
  }

  if (order.status !== 'PENDING') {
    throw new AppError(
      'Only pending orders can be cancelled',
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  return { message: 'Order cancelled successfully' };
};

export const getAdminOrders = async (query: OrderQueryInput) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '10');
  const skip = (page - 1) * limit;

  const where: { status?: any } = {};
  if (query.status) where.status = query.status;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
      items: {
        include: {
          product: {
            select: { name: true, images: true, slug: true, price: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', StatusCodes.NOT_FOUND);
  }

  return order;
};

export const updateOrderStatus = async (
  orderId: string,
  data: UpdateOrderStatusInput
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) {
    throw new AppError('Order not found', StatusCodes.NOT_FOUND);
  }

  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    throw new AppError(
      `Cannot update a ${order.status.toLowerCase()} order`,
      StatusCodes.BAD_REQUEST
    );
  }

  if (data.status === 'CANCELLED') {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', adminNote: data.adminNote },
      });

      const orderWithItems = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (orderWithItems) {
        for (const item of orderWithItems.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: data.status, adminNote: data.adminNote },
    });
  }

  if (data.status === 'CONFIRMED' || data.status === 'CANCELLED') {
    await sendEmail(
      order.user.email,
      `Your order has been ${data.status.toLowerCase()} — Educational Toy Centre`,
      orderStatusUpdateTemplate(
        order.user.name,
        order.id,
        data.status,
        data.adminNote
      )
    );
  }

  return { message: `Order ${data.status.toLowerCase()} successfully` };
};

export const getOrderStats = async () => {
  const [pending, confirmed, processing, shipped, delivered, cancelled] =
    await prisma.$transaction([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

  return { pending, confirmed, processing, shipped, delivered, cancelled };
};

const newOrderNotificationTemplate = (
  customerName: string,
  customerEmail: string,
  orderId: string,
  itemsList: string,
  address: any
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1A2F4A;">New Order Received</h2>
    <p>A new order has been placed on your store.</p>
    <div style="background: #F5C518; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="color: #1A2F4A; margin: 0;">Order ID: #${orderId.slice(0, 8).toUpperCase()}</h3>
    </div>
    <h4>Customer</h4>
    <p>${customerName} — ${customerEmail}</p>
    <h4>Items Ordered</h4>
    <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${itemsList}</pre>
    <h4>Delivery Address</h4>
    <p>${address.fullName}<br/>
    ${address.phone}<br/>
    ${address.address}, ${address.city}<br/>
    ${address.landmark ? `Landmark: ${address.landmark}` : ''}</p>
    <p style="color: #666;">Log in to your admin panel to confirm or manage this order.</p>
  </div>
`;

const orderStatusUpdateTemplate = (
  customerName: string,
  orderId: string,
  status: string,
  adminNote?: string
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1A2F4A;">Order Update</h2>
    <p>Hi ${customerName},</p>
    <p>Your order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
    ${adminNote ? `<div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;"><p style="margin: 0;"><strong>Message from us:</strong> ${adminNote}</p></div>` : ''}
    ${status === 'CONFIRMED' ? '<p>We will contact you shortly to arrange delivery.</p>' : ''}
    ${status === 'CANCELLED' ? '<p>If you have any questions, please contact us.</p>' : ''}
    <p>— Educational Toy Centre Team</p>
  </div>
`;