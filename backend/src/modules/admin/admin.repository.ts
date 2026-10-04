import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { AdminUserEntity } from './entities/admin-user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { OrderStatus } from '../orders/enums/order.enums';

@Injectable()
export class AdminRepository {
  private readonly logger = new Logger(AdminRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async findAdminByPhoneNumber(phone: string): Promise<AdminUserEntity | null> {
    const sql = `
      SELECT id, name, phone_number, role, created_at
      FROM admin_users
      WHERE phone_number = $1
    `;
    const res = await this.db.query<AdminUserEntity>(sql, [phone]);
    return res.rows[0] || null;
  }

  async findAllStaff(): Promise<AdminUserEntity[]> {
    const sql = `
      SELECT id, name, phone_number, role, created_at
      FROM admin_users
      ORDER BY created_at ASC
    `;
    const res = await this.db.query<AdminUserEntity>(sql);
    return res.rows;
  }

  async createAdminUser(
    name: string,
    phone: string,
    role: 'owner' | 'staff',
  ): Promise<AdminUserEntity> {
    const sql = `
      INSERT INTO admin_users (name, phone_number, role)
      VALUES ($1, $2, $3)
      RETURNING id, name, phone_number, role, created_at
    `;
    const res = await this.db.query<AdminUserEntity>(sql, [name, phone, role]);
    return res.rows[0];
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const sql = `DELETE FROM admin_users WHERE id = $1 RETURNING id`;
    const res = await this.db.query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async findAllProducts(options: {
    page: number;
    limit: number;
    category?: string;
    isActive?: boolean;
  }): Promise<{ items: any[]; total: number }> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.category) {
      params.push(options.category);
      whereConditions.push(`category = $${params.length}`);
    }

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      whereConditions.push(`is_active = $${params.length}`);
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;
    const countRes = await this.db.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (options.page - 1) * options.limit;
    params.push(options.limit);
    params.push(offset);

    const sql = `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const res = await this.db.query(sql, params);
    return { items: res.rows, total };
  }

  async createProduct(dto: CreateProductDto): Promise<any> {
    const sql = `
      INSERT INTO products (
        name,
        category,
        brand,
        description,
        dosage_info,
        price,
        mrp,
        stock_qty,
        hsn_code,
        gst_rate,
        image_urls,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING *
    `;
    const res = await this.db.query(sql, [
      dto.name,
      dto.category,
      dto.brand,
      dto.description || null,
      dto.dosageInfo || null,
      dto.price,
      dto.mrp,
      dto.stockQty,
      dto.hsnCode || null,
      dto.gstRate || 0,
      dto.imageUrls || [],
    ]);
    return res.rows[0];
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(dto.name);
    }
    if (dto.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(dto.category);
    }
    if (dto.brand !== undefined) {
      fields.push(`brand = $${idx++}`);
      values.push(dto.brand);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(dto.description);
    }
    if (dto.dosageInfo !== undefined) {
      fields.push(`dosage_info = $${idx++}`);
      values.push(dto.dosageInfo);
    }
    if (dto.price !== undefined) {
      fields.push(`price = $${idx++}`);
      values.push(dto.price);
    }
    if (dto.mrp !== undefined) {
      fields.push(`mrp = $${idx++}`);
      values.push(dto.mrp);
    }
    if (dto.stockQty !== undefined) {
      fields.push(`stock_qty = $${idx++}`);
      values.push(dto.stockQty);
    }
    if (dto.hsnCode !== undefined) {
      fields.push(`hsn_code = $${idx++}`);
      values.push(dto.hsnCode);
    }
    if (dto.gstRate !== undefined) {
      fields.push(`gst_rate = $${idx++}`);
      values.push(dto.gstRate);
    }
    if (dto.imageUrls !== undefined) {
      fields.push(`image_urls = $${idx++}`);
      values.push(dto.imageUrls);
    }
    if (dto.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(dto.isActive);
    }

    if (fields.length === 0) {
      const existing = await this.db.query(
        'SELECT * FROM products WHERE id = $1',
        [id],
      );
      return existing.rows[0] || null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const res = await this.db.query(sql, values);
    return res.rows[0] || null;
  }

  async updateStock(id: string, stockQty: number): Promise<any | null> {
    const sql = `
      UPDATE products
      SET stock_qty = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const res = await this.db.query(sql, [stockQty, id]);
    return res.rows[0] || null;
  }

  async softDeleteProduct(id: string): Promise<any | null> {
    const sql = `
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const res = await this.db.query(sql, [id]);
    return res.rows[0] || null;
  }

  async findAllOrders(options: {
    page: number;
    limit: number;
    status?: OrderStatus;
  }): Promise<{ items: any[]; total: number }> {
    const offset = (options.page - 1) * options.limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (options.status) {
      params.push(options.status);
      whereConditions.push(`o.status = $${params.length}`);
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM orders o ${whereClause}`;
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
        u.phone_number AS customer_phone,
        u.name AS customer_name,
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
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ${whereClause}
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const itemsRes = await this.db.query(itemsSql, itemsParams);
    return { items: itemsRes.rows, total };
  }

  async findOrderById(id: string): Promise<any | null> {
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
        json_build_object(
          'id', u.id,
          'phoneNumber', u.phone_number,
          'name', u.name,
          'address', u.address,
          'pincode', u.pincode,
          'district', u.district,
          'region', u.region
        ) AS customer,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'productName', p.name,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, u.id
    `;
    const res = await this.db.query(sql, [id]);
    return res.rows[0] || null;
  }
}
