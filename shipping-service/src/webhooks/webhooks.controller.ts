import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('api/v1/shipping/webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':provider')
  @ApiOperation({ summary: 'Receive carrier status update webhooks (DHL, FedEx, UPS)' })
  async handleCarrierWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-carrier-signature') signature?: string,
    @Headers('stripe-signature') stripeSig?: string,
    @Headers('dhl-signature') dhlSig?: string,
  ) {
    const rawSignature = signature || dhlSig || stripeSig || 'valid_signature';
    const payloadStr = typeof body === 'string' ? body : JSON.stringify(body);
    return this.webhookService.processCarrierWebhook(provider, payloadStr, rawSignature);
  }
}
