import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("price", "prices");

export const usePricing = hooks.useList;
export const useCreatePrice = hooks.useCreate;
export const useUpdatePrice = hooks.useUpdate;
export const useDeletePrice = hooks.useDelete;
