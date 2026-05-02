import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

@Controller('integration/topup/webhook')
export class StripeWebhookController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Missing raw body for stripe webhook');
    }
    return this.integrationService.processStripeWebhook(signature, rawBody);
  }
}
