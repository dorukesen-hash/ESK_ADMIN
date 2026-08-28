import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("dimension", "dimensions");

export const useDimensions = hooks.useList;
export const useCreateDimension = hooks.useCreate;
export const useUpdateDimension = hooks.useUpdate;
export const useDeleteDimension = hooks.useDelete;
