import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

import { ConfigService } from '@nestjs/config';
import { RagService } from 'services/rag.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly supabase: SupabaseService,
        private readonly ragService: RagService
    ) { }

    // Lấy danh sách tất cả sản phẩm
    async findAll() {
        const { data, error } = await this.supabase.getClient()
            .from('products')
            .select('*');

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findOne(id: string) {
        const supabase = await this.supabase.getClient()

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single(); // .single() để lấy ra 1 object thay vì mảng

        if (error) {
            this.logger.error(`Error fetching product: ${error.message}`, error);
        }

        if (error || !data) {
            throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
        }

        return data;
    }

    // Thêm sản phẩm mới (Admin)
    async create(productData: any) {
        const { data, error } = await this.supabase.getClient()
            .from('products')
            .insert([productData])
            .select();

        if (error) throw new InternalServerErrorException(error.message);
        
        const newProduct = data[0];

        try {
            // Dùng service trong rag.service.ts theo yêu cầu của bạn
            await this.ragService.addProductToVectorDB(newProduct);
            this.logger.log(`Đã đồng bộ sản phẩm ${newProduct.id} lên Pinecone thông qua RagService.`);
        } catch (err) {
            this.logger.error(`Lỗi khi đồng bộ sản phẩm mới lên Pinecone: ${err.message}`);
        }

        return newProduct;
    }

    // Xóa sản phẩm (Admin)
    async remove(id: string) {
        const { data, error } = await this.supabase.getClient()
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw new InternalServerErrorException(error.message);
        return { message: 'Xóa thành công' };
    }
}