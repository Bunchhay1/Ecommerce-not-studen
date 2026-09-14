import { Module } from '@nestjs/common';
import { LocalCarrierProvider } from './local-carrier.provider';
import { DhlProvider } from './dhl.provider';
import { FedexProvider } from './fedex.provider';
import { UpsProvider } from './ups.provider';

@Module({
  providers: [LocalCarrierProvider, DhlProvider, FedexProvider, UpsProvider],
  exports: [LocalCarrierProvider, DhlProvider, FedexProvider, UpsProvider],
})
export class CarriersModule {}
