import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './enums/order.enums';

export interface CreateOrderParams {
  userId: string;
  items: { productId: string; quantity: number }[];
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  calculateDeliveryFee: (subtotal: number) => number;
  gstInvoiceNo: string;
  idempotencyKey?: string;
}

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const sql = `
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.fulfillment_type,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.gst_invoice_no,
        o.idempotency_key,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const res = await this.db.query(sql, [id]);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return this.mapOrderRow(row);
  }

  async findByIdempotencyKey(key: string): Promise<OrderEntity | null> {
    const sql = `
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.fulfillment_type,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.gst_invoice_no,
        o.idempotency_key,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.idempotency_key = $1
      GROUP BY o.id
    `;
    const res = await this.db.query(sql, [key]);
    if (!res.rows[0]) return null;

    return this.mapOrderRow(res.rows[0]);
  }

  async findByUserId(
    userId: string,
    options: { page: number; limit: number; status?: OrderStatus },
  ): Promise<{ items: OrderEntity[]; total: number }> {
    const offset = (options.page - 1) * options.limit;

    const whereConditions = ['o.user_id = $1'];
    const params: any[] = [userId];

    if (options.status) {
      params.push(options.status);
      whereConditions.push(`o.status = $${params.length}`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countSql = `SELECT COUNT(*) AS total FROM orders o WHERE ${whereClause}`;
    const countRes = await this.db.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const itemsParams = [...params, options.limit, offset];
    const itemsSql = `
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.fulfillment_type,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.gst_invoice_no,
        o.idempotency_key,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const itemsRes = await this.db.query(itemsSql, itemsParams);
    const items = itemsRes.rows.map((row) => this.mapOrderRow(row));

    return { items, total };
  }

  /**
   * Concurrency-safe atomic transaction for order creation.
   * Atomically decrements stock using conditional SQL updates.
   * If any product has insufficient stock, the entire transaction rolls back.
   */
  async createOrderTransaction(params: CreateOrderParams): Promise<OrderEntity> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Check idempotency if key provided
      if (params.idempotencyKey) {
        const existingRes = await client.query(
          'SELECT id FROM orders WHERE idempotency_key = $1',
          [params.idempotencyKey],
        );
        if (existingRes.rows.length > 0) {
          await client.query('COMMIT');
          const existing = await this.findById(existingRes.rows[0].id);
          return existing!;
        }
      }

      // 2. Decrement inventory atomically and compute pricing
      const lineItems: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      let itemsSubtotal = 0;

      for (const item of params.items) {
        // Atomic conditional decrement: stock_qty >= quantity
        const updateSql = `
          UPDATE products
          SET stock_qty = stock_qty - $1, updated_at = NOW()
          WHERE id = $2 AND stock_qty >= $1 AND is_active = true
          RETURNING id, name, price, stock_qty
        `;
        const updateRes = await client.query(updateSql, [
          item.quantity,
          item.productId,
        ]);

        if (updateRes.rowCount === 0) {
          // Check reason for failure to provide precise feedback
          const checkSql = `SELECT name, stock_qty, is_active FROM products WHERE id = $1`;
          const checkRes = await client.query(checkSql, [item.productId]);

          if (checkRes.rowCount === 0) {
            throw new NotFoundException(
              `Product with ID "${item.productId}" was not found`,
            );
          }

          const product = checkRes.rows[0];
          if (!product.is_active) {
            throw new BadRequestException(
              `Product "${product.name}" is no longer active for purchase`,
            );
          }

          throw new ConflictException(
            `Insufficient stock for "${product.name}". Available stock: ${product.stock_qty}, requested: ${item.quantity}`,
          );
        }

        const product = updateRes.rows[0];
        const unitPrice = parseFloat(product.price);
        const subtotal = unitPrice * item.quantity;
        itemsSubtotal += subtotal;

        lineItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      const deliveryFee = params.calculateDeliveryFee(itemsSubtotal);
      const totalAmount = itemsSubtotal + deliveryFee;

      // 3. Create order record
      const orderSql = `
        INSERT INTO orders (
          user_id,
          status,
          fulfillment_type,
          total_amount,
          payment_status,
          payment_method,
          gst_invoice_no,
          idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, status, fulfillment_type, total_amount, payment_status, payment_method, gst_invoice_no, idempotency_key, created_at
      `;

      const orderRes = await client.query(orderSql, [
        params.userId,
        OrderStatus.PLACED,
        params.fulfillmentType,
        totalAmount,
        PaymentStatus.PENDING,
        params.paymentMethod,
        params.gstInvoiceNo,
        params.idempotencyKey || null,
      ]);

      const orderRow = orderRes.rows[0];
      const createdItems: OrderItemEntity[] = [];

      // 4. Create order_items records
      for (const item of lineItems) {
        const itemSql = `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, order_id, product_id, quantity, unit_price, subtotal
        `;
        const itemRes = await client.query(itemSql, [
          orderRow.id,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.subtotal,
        ]);

        createdItems.push({
          id: itemRes.rows[0].id,
          order_id: orderRow.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        });
      }

      await client.query('COMMIT');

      const entity = new OrderEntity();
      entity.id = orderRow.id;
      entity.user_id = orderRow.user_id;
      entity.status = orderRow.status;
      entity.fulfillment_type = orderRow.fulfillment_type;
      entity.total_amount = parseFloat(orderRow.total_amount);
      entity.payment_status = orderRow.payment_status;
      entity.payment_method = orderRow.payment_method;
      entity.gst_invoice_no = orderRow.gst_invoice_no;
      entity.idempotency_key = orderRow.idempotency_key;
      entity.created_at = orderRow.created_at;
      entity.items = createdItems;

      return entity;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException && error.getStatus() < 500) {
        this.logger.warn(`Order creation transaction rolled back: ${(error as Error).message}`);
      } else {
        this.logger.error(`Order creation transaction rolled back: ${(error as Error).message}`);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancels order and restores stock back to products table atomically.
   */
  async cancelOrderAndRestoreStock(orderId: string): Promise<OrderEntity> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Lock and update order
      const updateOrderSql = `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING *
      `;
      const updateOrderRes = await client.query(updateOrderSql, [
        OrderStatus.CANCELLED,
        orderId,
      ]);

      if (updateOrderRes.rowCount === 0) {
        throw new NotFoundException(`Order with ID "${orderId}" not found`);
      }

      // 2. Fetch items to restore
      const itemsSql = `
        SELECT product_id, quantity
        FROM order_items
        WHERE order_id = $1
      `;
      const itemsRes = await client.query(itemsSql, [orderId]);

      // 3. Restore inventory
      for (const item of itemsRes.rows) {
        const restoreSql = `
          UPDATE products
          SET stock_qty = stock_qty + $1, updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(restoreSql, [item.quantity, item.product_id]);
      }

      await client.query('COMMIT');

      const fullOrder = await this.findById(orderId);
      return fullOrder!;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException && error.getStatus() < 500) {
        this.logger.warn(`Order cancellation transaction rolled back: ${(error as Error).message}`);
      } else {
        this.logger.error(`Order cancellation transaction rolled back: ${(error as Error).message}`);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderEntity | null> {
    const sql = `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING id, user_id, status, fulfillment_type, total_amount, payment_status, payment_method, gst_invoice_no, idempotency_key, created_at
    `;
    const res = await this.db.query(sql, [newStatus, orderId]);
    if (!res.rows[0]) return null;

    return this.findById(orderId);
  }

  private mapOrderRow(row: any): OrderEntity {
    const entity = new OrderEntity();
    entity.id = row.id;
    entity.user_id = row.user_id;
    entity.status = row.status as OrderStatus;
    entity.fulfillment_type = row.fulfillment_type as FulfillmentType;
    entity.total_amount = parseFloat(row.total_amount);
    entity.payment_status = row.payment_status as PaymentStatus;
    entity.payment_method = row.payment_method as PaymentMethod;
    entity.gst_invoice_no = row.gst_invoice_no;
    entity.idempotency_key = row.idempotency_key;
    entity.created_at = row.created_at;
    entity.items = Array.isArray(row.items)
      ? row.items.map((i: any) => ({
          id: i.id,
          order_id: i.order_id || row.id,
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: parseInt(i.quantity, 10),
          unit_price: parseFloat(i.unit_price),
          subtotal: parseFloat(i.subtotal),
        }))
      : [];
    return entity;
  }
}
