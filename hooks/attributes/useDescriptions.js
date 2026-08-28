import { createCrudHooks } from "./createCrudHooks";

const hooks = createCrudHooks("description", "descriptions");

export const useDescriptions = hooks.useList;
export const useCreateDescription = hooks.useCreate;
export const useUpdateDescription = hooks.useUpdate;
export const useDeleteDescription = hooks.useDelete;
