import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseGuard } from '../auth/supabase.guard';

describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    const mockCartService = {};
    const mockSupabaseService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: mockCartService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    })
      .overrideGuard(SupabaseGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
