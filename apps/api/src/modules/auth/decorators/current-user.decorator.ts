import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser decorator
 * Extracts the authenticated user from the request object
 * Must be used with JwtAuthGuard or other authentication guard
 *
 * @example
 * // Get entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 *
 * @example
 * // Get specific property
 * @Get('my-id')
 * @UseGuards(JwtAuthGuard)
 * getMyId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return just that property
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
