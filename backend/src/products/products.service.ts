import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    
    constructor(private readonly supabase: SupabaseService) { }

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
        return data[0];
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