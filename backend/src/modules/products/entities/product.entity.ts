import { ProductCategory } from '../dto/product-category.enum';

export class ProductEntity {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string | null;
  dosage_info: string | null;
  price: number;
  mrp: number;
  stock_qty: number;
  hsn_code: string | null;
  gst_rate: number;
  image_urls: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
