import { Test, TestingModule } from '@nestjs/testing';
import { GatewayPaymentService } from './gateway-payment.service';

describe('GatewayPaymentService', () => {
  let service: GatewayPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayPaymentService],
    }).compile();

    service = module.get<GatewayPaymentService>(GatewayPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
