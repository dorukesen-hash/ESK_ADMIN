import { createCrudHooks } from "@/hooks/attributes/createCrudHooks";

const hooks = createCrudHooks("carrierprice", "carrierPrices");

export const useCarrierPrices = hooks.useList;
export const useCreateCarrierPrice = hooks.useCreate;
export const useUpdateCarrierPrice = hooks.useUpdate;
export const useDeleteCarrierPrice = hooks.useDelete;
