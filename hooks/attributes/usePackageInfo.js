import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("package", "packageInfo");

export const usePackageInfo = hooks.useList;
export const useCreatePackageInfo = hooks.useCreate;
export const useUpdatePackageInfo = hooks.useUpdate;
export const useDeletePackageInfo = hooks.useDelete;
