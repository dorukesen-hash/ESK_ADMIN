import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("specification", "specifications");

export const useSpecifications = hooks.useList;
export const useCreateSpecification = hooks.useCreate;
export const useUpdateSpecification = hooks.useUpdate;
export const useDeleteSpecification = hooks.useDelete;
