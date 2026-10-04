export class UserEntity {
  id: string;
  phone_number: string;
  name: string | null;
  address: string | null;
  pincode: string | null;
  district: string | null;
  region: string | null;
  created_at: Date;
}
