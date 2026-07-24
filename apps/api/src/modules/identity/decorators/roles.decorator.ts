import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more role keys (see RoleKey enum). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
