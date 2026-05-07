import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseGuard } from '../auth/supabase.guard';

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const mockOrdersService = {};
    const mockSupabaseService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    })
      .overrideGuard(SupabaseGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
