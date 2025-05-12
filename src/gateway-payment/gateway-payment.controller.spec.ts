import { Test, TestingModule } from '@nestjs/testing';
import { GatewayPaymentController } from './gateway-payment.controller';

describe('GatewayPaymentController', () => {
  let controller: GatewayPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayPaymentController],
    }).compile();

    controller = module.get<GatewayPaymentController>(GatewayPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
