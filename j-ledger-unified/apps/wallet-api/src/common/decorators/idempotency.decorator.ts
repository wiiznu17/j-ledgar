import { SetMetadata } from '@nestjs/common';

export const REQUIRE_IDEMPOTENCY_KEY = 'require_idempotency';
export const RequireIdempotency = () => SetMetadata(REQUIRE_IDEMPOTENCY_KEY, true);
