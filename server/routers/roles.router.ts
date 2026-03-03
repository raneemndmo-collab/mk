import {
  TRPCError, z, router,
  publicProcedure, protectedProcedure, adminProcedure, adminWithPermission,
  PERMISSIONS, PERMISSION_CATEGORIES, clearPermissionCache,
  db,
  sharedDb,
  rolesTable,
  eqDrizzle,
} from "./_shared";

// Domain: roles
// Extracted from server/routers/misc.router.ts — DO NOT modify procedure names/shapes

export const rolesRouterDefs = {
  permissions: router({
    list: adminWithPermission(PERMISSIONS.MANAGE_SETTINGS).query(async () => {
      return db.getAllAdminPermissions();
    }),

    get: adminWithPermission(PERMISSIONS.MANAGE_SETTINGS)
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getAdminPermissions(input.userId);
      }),

    set: adminWithPermission(PERMISSIONS.MANAGE_SETTINGS)
      .input(z.object({
        userId: z.number(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if target is root admin - cannot modify
        const existing = await db.getAdminPermissions(input.userId);
        if (existing?.isRootAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot modify root admin permissions' });
        }
        await db.setAdminPermissions(input.userId, input.permissions);
        return { success: true };
      }),

    delete: adminWithPermission(PERMISSIONS.MANAGE_SETTINGS)
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const existing = await db.getAdminPermissions(input.userId);
        if (existing?.isRootAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete root admin' });
        }
        await db.deleteAdminPermissions(input.userId);
        return { success: true };
      }),
  }),

  permissionMeta: router({
    categories: publicProcedure.query(() => {
      return PERMISSION_CATEGORIES;
    }),
  }),

  roles: router({
    list: adminWithPermission(PERMISSIONS.MANAGE_ROLES).query(async () => {
      const allRoles = await sharedDb.select().from(rolesTable);
      return allRoles.map(r => ({ ...r, permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions as string) : r.permissions }));
    }),

    getById: adminWithPermission(PERMISSIONS.MANAGE_ROLES)
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [role] = await sharedDb.select().from(rolesTable).where(eqDrizzle(rolesTable.id, input.id));
        if (!role) throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
        return { ...role, permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions as string) : role.permissions };
      }),

    create: adminWithPermission(PERMISSIONS.MANAGE_ROLES)
      .input(z.object({
        name: z.string().max(100),
        nameAr: z.string().max(100),
        description: z.string().max(500).optional(),
        descriptionAr: z.string().max(500).optional(),
        permissions: z.array(z.string().max(100)),
      }))
      .mutation(async ({ input }) => {
        const result = await sharedDb.insert(rolesTable).values({
          ...input,
          permissions: JSON.stringify(input.permissions),
        } as any);
        return { id: result[0].insertId, success: true };
      }),

    update: adminWithPermission(PERMISSIONS.MANAGE_ROLES)
      .input(z.object({
        id: z.number(),
        name: z.string().max(100).optional(),
        nameAr: z.string().max(100).optional(),
        description: z.string().max(500).optional(),
        descriptionAr: z.string().max(500).optional(),
        permissions: z.array(z.string().max(100)).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, permissions, ...rest } = input;
        const updateData: any = { ...rest };
        if (permissions) updateData.permissions = JSON.stringify(permissions);
        // Prevent editing system roles name
        const [existing] = await sharedDb.select().from(rolesTable).where(eqDrizzle(rolesTable.id, id));
        if (existing?.isSystem) {
          delete updateData.name;
          delete updateData.nameAr;
        }
        await sharedDb.update(rolesTable).set(updateData).where(eqDrizzle(rolesTable.id, id));
        return { success: true };
      }),

    delete: adminWithPermission(PERMISSIONS.MANAGE_ROLES)
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const [existing] = await sharedDb.select().from(rolesTable).where(eqDrizzle(rolesTable.id, input.id));
        if (existing?.isSystem) throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete system role' });
        await sharedDb.delete(rolesTable).where(eqDrizzle(rolesTable.id, input.id));
        return { success: true };
      }),

    // Assign role to user
    assignToUser: adminWithPermission(PERMISSIONS.MANAGE_ROLES)
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const [role] = await sharedDb.select().from(rolesTable).where(eqDrizzle(rolesTable.id, input.roleId));
        if (!role) throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
        const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions as string) : role.permissions;
        await db.setAdminPermissions(input.userId, perms);
        clearPermissionCache(input.userId);
        return { success: true };
      }),
  }),

};
