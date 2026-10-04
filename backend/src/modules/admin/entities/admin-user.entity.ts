export class AdminUserEntity {
  id: string;
  name: string;
  phone_number: string;
  role: 'owner' | 'staff';
  created_at: Date;
}
