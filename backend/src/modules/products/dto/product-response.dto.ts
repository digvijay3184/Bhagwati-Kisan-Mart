import { ProductCategory } from './product-category.enum';
import { ProductEntity } from '../entities/product.entity';

export class ProductResponseDto {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string | null;
  dosageInfo: string | null;
  price: number;
  mrp: number;
  inStock: boolean;
  stockQty: number;
  hsnCode: string | null;
  gstRate: number;
  imageUrls: string[];
  createdAt: string;

  static fromEntity(entity: ProductEntity): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.category = entity.category;
    dto.brand = entity.brand;
    dto.description = entity.description;
    dto.dosageInfo = entity.dosage_info;
    dto.price = Number(entity.price);
    dto.mrp = Number(entity.mrp);
    dto.stockQty = entity.stock_qty;
    dto.inStock = entity.stock_qty > 0;
    dto.hsnCode = entity.hsn_code;
    dto.gstRate = Number(entity.gst_rate);
    dto.imageUrls = entity.image_urls || [];
    dto.createdAt = entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString();
    return dto;
  }
}
