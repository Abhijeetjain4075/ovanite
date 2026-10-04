import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { resolvePortalRole, type StaffRole } from "../portal/access";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireStaff = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  const portalRole = resolvePortalRole(ctx.user);
  if (portalRole === "participant") {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user, portalRole: portalRole as StaffRole } });
});

/** Staff read access; viewers are allowed, participants are not. */
export const staffProcedure = t.procedure.use(requireStaff);

/** Review access for owners and editors. Viewers remain strictly read-only. */
export const reviewerProcedure = staffProcedure.use(({ ctx, next }) => {
  if (ctx.portalRole === "viewer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "This action is read-only for your role." });
  }
  return next({ ctx });
});

/** Administration access for the owner only. */
export const ownerProcedure = staffProcedure.use(({ ctx, next }) => {
  if (ctx.portalRole !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access is required for this action." });
  }
  return next({ ctx });
});

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
