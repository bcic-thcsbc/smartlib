export type Role = "admin" | "user";
export type UserType = "student" | "teacher";
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  user_type?: UserType;
  class_name?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: string;
  gender?: "male" | "female";
}
export interface UserForm {
  username: string;
  password?: string;
  full_name: string;
  user_type: UserType;
  class_name?: string;
  department?: string;
  email?: string;
  phone?: string;
  gender?: "male" | "female";
}
