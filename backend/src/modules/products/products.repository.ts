import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { ProductEntity } from './entities/product.entity';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsRepository {
  private readonly logger = new Logger(ProductsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async findActive(
    query: ProductQueryDto,
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(query.category);
    }

    if (query.brand) {
      conditions.push(`brand ILIKE $${paramIndex++}`);
      params.push(`%${query.brand}%`);
    }

    if (query.search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`,
      );
      params.push(`%${query.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // 1. Count query
    const countSql = `SELECT COUNT(*)::int AS total FROM products WHERE ${whereClause}`;
    const countResult = await this.db.query<{ total: number }>(countSql, [...params]);
    const total = countResult.rows[0]?.total || 0;

    // 2. Data query
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const dataParams = [...params, limit, offset];
    const limitParam = `$${paramIndex++}`;
    const offsetParam = `$${paramIndex++}`;

    const dataSql = `
      SELECT 
        id, name, category, brand, description, dosage_info,
        price, mrp, stock_qty, hsn_code, gst_rate, image_urls,
        is_active, created_at, updated_at
      FROM products 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const dataResult = await this.db.query<ProductEntity>(dataSql, dataParams);
    return {
      items: dataResult.rows,
      total,
    };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const sql = `
      SELECT 
        id, name, category, brand, description, dosage_info,
        price, mrp, stock_qty, hsn_code, gst_rate, image_urls,
        is_active, created_at, updated_at
      FROM products 
      WHERE id = $1 AND is_active = true
    `;
    const result = await this.db.query<ProductEntity>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Concurrency-safe atomic stock decrement per PRD Section 2.5.3
   * UPDATE products SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty
   */
  async atomicDecrementStock(id: string, qty: number): Promise<boolean> {
    const sql = `
      UPDATE products 
      SET stock_qty = stock_qty - $1, updated_at = NOW() 
      WHERE id = $2 AND stock_qty >= $1 AND is_active = true
      RETURNING id
    `;
    const result = await this.db.query(sql, [qty, id]);
    return (result.rowCount ?? 0) > 0;
  }

  async create(product: Partial<ProductEntity>): Promise<ProductEntity> {
    const sql = `
      INSERT INTO products (
        name, category, brand, description, dosage_info,
        price, mrp, stock_qty, hsn_code, gst_rate, image_urls, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        id, name, category, brand, description, dosage_info,
        price, mrp, stock_qty, hsn_code, gst_rate, image_urls,
        is_active, created_at, updated_at
    `;
    const params = [
      product.name,
      product.category,
      product.brand,
      product.description || null,
      product.dosage_info || null,
      product.price,
      product.mrp,
      product.stock_qty ?? 0,
      product.hsn_code || null,
      product.gst_rate ?? 0.0,
      product.image_urls || [],
      product.is_active ?? true,
    ];
    const result = await this.db.query<ProductEntity>(sql, params);
    return result.rows[0];
  }
}
