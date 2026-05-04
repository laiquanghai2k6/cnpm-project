import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config'
import { SupabaseModule } from './supabase/supabase.module';
import { ChatModule } from './chat/chat.module';
import { AiAdminController } from 'controllers/ai-agent.controller';
import { RagService } from 'services/rag.service';
@Module({
  imports: [AuthModule, OrdersModule, CartModule, ProductsModule,ChatModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    ChatModule,
  ],
  controllers: [AppController,AiAdminController],
  providers: [AppService,RagService],
})
export class AppModule {}
