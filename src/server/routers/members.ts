import {
  router,
  protectedProcedure,
  staffProcedure,
  adminProcedure,
} from "../trpc";
import { MemberService } from "../services/member.service";
import {
  updateProfileSchema,
  searchMembersSchema,
  memberByIdSchema,
  setMemberActiveSchema,
  setMemberRoleSchema,
  lookupMemberSchema,
} from "@/shared/schemas/member.schema";

export const membersRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    return MemberService.getProfile(ctx.db, ctx.user);
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return MemberService.updateProfile(ctx.db, ctx.user.id, input);
    }),

  search: staffProcedure
    .input(searchMembersSchema)
    .query(async ({ ctx, input }) => {
      return MemberService.searchMembers(ctx.db, input);
    }),

  byId: staffProcedure
    .input(memberByIdSchema)
    .query(async ({ ctx, input }) => {
      return MemberService.getMemberById(ctx.db, input.id);
    }),

  setActive: adminProcedure
    .input(setMemberActiveSchema)
    .mutation(async ({ ctx, input }) => {
      return MemberService.setMemberActive(ctx.db, input.id, input.active);
    }),

  setRole: adminProcedure
    .input(setMemberRoleSchema)
    .mutation(async ({ ctx, input }) => {
      return MemberService.setMemberRole(ctx.db, input.id, input.role);
    }),

  lookupByEmailOrPhone: staffProcedure
    .input(lookupMemberSchema)
    .query(async ({ ctx, input }) => {
      return MemberService.lookupByEmailOrPhone(ctx.db, input.query);
    }),
});
