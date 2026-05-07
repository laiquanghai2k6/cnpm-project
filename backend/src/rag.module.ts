import { Global, Module } from '@nestjs/common';
import { RagService } from 'services/rag.service';

@Global()
@Module({
  providers: [RagService],
  exports: [RagService]
})
export class RagModule {}
