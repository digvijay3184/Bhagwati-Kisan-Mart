import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListOrdersQueryDto } from '../orders/dto/list-orders-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Staff Management (Owner only)
  @Get('staff')
  @Roles('owner')
  async listStaff() {
    return this.adminService.listStaff();
  }

  @Post('staff')
  @Roles('owner')
  @HttpCode(HttpStatus.CREATED)
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaff(dto);
  }

  @Delete('staff/:id')
  @Roles('owner')
  async deleteStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteStaff(id);
  }

  // 2. Product Management
  @Get('products')
  @Roles('owner', 'staff')
  async listProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active =
      isActive === undefined ? undefined : isActive === 'true';
    return this.adminService.listProducts({ page, limit, category, isActive: active });
  }

  @Post('products')
  @Roles('owner')
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles('owner')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Patch('products/:id/stock')
  @Roles('owner', 'staff')
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.adminService.updateStock(id, dto.stockQty);
  }

  @Delete('products/:id')
  @Roles('owner')
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteProduct(id);
  }

  // 3. Order Management
  @Get('orders')
  @Roles('owner', 'staff')
  async listOrders(@Query() query: ListOrdersQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Get('orders/:id')
  @Roles('owner', 'staff')
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @Roles('owner', 'staff')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }
}
