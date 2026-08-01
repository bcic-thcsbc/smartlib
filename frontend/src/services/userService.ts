import { userApi } from "../api/userApi";
export const userService = {
  list: (query: string) => userApi.list({ q: query }),
  profile: () => userApi.profile(),
  updateProfile: (data: any) => userApi.updateProfile(data),
};
