import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("pallet", "palletInfo");

export const usePalletInfo = hooks.useList;
export const useCreatePalletInfo = hooks.useCreate;
export const useUpdatePalletInfo = hooks.useUpdate;
export const useDeletePalletInfo = hooks.useDelete;
