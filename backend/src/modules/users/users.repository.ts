import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const sql = `
      SELECT id, phone_number, name, address, pincode, district, region, created_at
      FROM users
      WHERE phone_number = $1
    `;
    const res = await this.db.query<UserEntity>(sql, [phoneNumber]);
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const sql = `
      SELECT id, phone_number, name, address, pincode, district, region, created_at
      FROM users
      WHERE id = $1
    `;
    const res = await this.db.query<UserEntity>(sql, [id]);
    return res.rows[0] || null;
  }

  async create(phoneNumber: string): Promise<UserEntity> {
    const sql = `
      INSERT INTO users (phone_number)
      VALUES ($1)
      RETURNING id, phone_number, name, address, pincode, district, region, created_at
    `;
    const res = await this.db.query<UserEntity>(sql, [phoneNumber]);
    return res.rows[0];
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(data.address);
    }
    if (data.pincode !== undefined) {
      fields.push(`pincode = $${idx++}`);
      values.push(data.pincode);
    }
    if (data.district !== undefined) {
      fields.push(`district = $${idx++}`);
      values.push(data.district);
    }
    if (data.region !== undefined) {
      fields.push(`region = $${idx++}`);
      values.push(data.region);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, phone_number, name, address, pincode, district, region, created_at
    `;

    const res = await this.db.query<UserEntity>(sql, values);
    return res.rows[0] || null;
  }
}
