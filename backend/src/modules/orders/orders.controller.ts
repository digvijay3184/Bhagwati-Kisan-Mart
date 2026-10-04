import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateOrderDto,
    @Headers('x-idempotency-key') headerIdempotencyKey?: string,
  ) {
    return this.ordersService.createOrder(userId, dto, headerIdempotencyKey);
  }

  @Get()
  async listOrders(
    @CurrentUser('userId') userId: string,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.ordersService.listOrders(userId, query);
  }

  @Get(':id')
  async getOrder(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getOrderById(id, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, dto.reason);
  }
}
