import { createCrudHooks } from "@/hooks/attributes/createCrudHooks";

const hooks = createCrudHooks("deci", "deci");

export const useDeciList = hooks.useList;
export const useCreateDeci = hooks.useCreate;
export const useUpdateDeci = hooks.useUpdate;
export const useDeleteDeci = hooks.useDelete;
