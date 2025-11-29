import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser decorator
 * Extracts the authenticated user from the request object
 * Must be used with JwtAuthGuard or other authentication guard
 *
 * @example
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
