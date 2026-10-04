import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { OrderStatus } from '../orders/enums/order.enums';
import { AdminUserEntity } from './entities/admin-user.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly ordersService: OrdersService,
  ) {}

  // 1. Staff Management
  async listStaff(): Promise<AdminUserEntity[]> {
    return this.adminRepository.findAllStaff();
  }

  async createStaff(dto: CreateStaffDto): Promise<AdminUserEntity> {
    const normalizedPhone = dto.phoneNumber.startsWith('+91')
      ? dto.phoneNumber
      : `+91${dto.phoneNumber.replace(/^0+/, '')}`;

    const existing =
      await this.adminRepository.findAdminByPhoneNumber(normalizedPhone);
    if (existing) {
      throw new ConflictException(
        `Staff account with phone number ${normalizedPhone} already exists`,
      );
    }

    return this.adminRepository.createAdminUser(
      dto.name,
      normalizedPhone,
      dto.role || 'staff',
    );
  }

  async deleteStaff(id: string): Promise<{ message: string }> {
    const deleted = await this.adminRepository.deleteAdminUser(id);
    if (!deleted) {
      throw new NotFoundException(`Staff user with ID "${id}" not found`);
    }
    return { message: 'Staff user removed successfully' };
  }

  // 2. Product Management
  async listProducts(query: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const { items, total } = await this.adminRepository.findAllProducts({
      page,
      limit,
      category: query.category,
      isActive: query.isActive,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createProduct(dto: CreateProductDto) {
    if (dto.mrp < dto.price) {
      throw new BadRequestException('MRP must be greater than or equal to price');
    }
    return this.adminRepository.createProduct(dto);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    if (dto.price !== undefined && dto.mrp !== undefined && dto.mrp < dto.price) {
      throw new BadRequestException('MRP must be greater than or equal to price');
    }

    const updated = await this.adminRepository.updateProduct(id, dto);
    if (!updated) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return updated;
  }

  async updateStock(id: string, stockQty: number) {
    const updated = await this.adminRepository.updateStock(id, stockQty);
    if (!updated) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return updated;
  }

  async deleteProduct(id: string) {
    const updated = await this.adminRepository.softDeleteProduct(id);
    if (!updated) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return { message: 'Product deactivated successfully (soft-delete)' };
  }

  // 3. Order Management
  async listOrders(query: { page?: number; limit?: number; status?: OrderStatus }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const { items, total } = await this.adminRepository.findAllOrders({
      page,
      limit,
      status: query.status,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getOrder(id: string) {
    const order = await this.adminRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus) {
    return this.ordersService.updateOrderStatus(id, newStatus);
  }
}
