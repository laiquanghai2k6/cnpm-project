import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from 'src/products/products.service';

// Định nghĩa Interface cho sản phẩm của bạn
interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
}

@Injectable()
export class RagService {
    private ai: GoogleGenerativeAI;
    private pinecone: Pinecone;

    constructor(private configService: ConfigService,

        private readonly productsService: ProductsService,
    ) {

        this.ai = new GoogleGenerativeAI(
            this.configService.get<string>('GEMINI_API_KEY')!,
        );

        this.pinecone = new Pinecone({
            apiKey: this.configService.get<string>('PINECONE_API_KEY')!,
        });
    }
    async addProductToVectorDB(product: Product) {
        // Rút gọn text để tiết kiệm token
        const safeDesc = product.description ? product.description.substring(0, 1000) : 'Không có mô tả';
        const textToEmbed = `Sản phẩm: ${product.name}. Mô tả: ${safeDesc}. Giá: ${product.price}đ. Tình trạng: ${product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}.`;

        // Dùng model 3072 chiều
        const model = this.ai.getGenerativeModel({ model: "gemini-embedding-2" });

        // Nếu có lỗi ở API Google, nó sẽ tự văng lỗi (throw error) ở dòng này
        const result = await model.embedContent(textToEmbed);
        const vector = result.embedding.values;

        const index = this.pinecone.Index('products-index');

        // Nếu có lỗi ở Pinecone, nó cũng sẽ tự văng lỗi ở dòng này
        await index.upsert({
            records: [
                {
                    id: product.id,
                    values: vector,
                    metadata: {
                        name: product.name,
                        description: safeDesc,
                        price: product.price,
                        stock: product.stock,
                        image_url: product.image_url
                    }
                }
            ]
        });
    }

    async syncAllProductsToVector() {
        console.log('🚀 Bắt đầu quá trình đồng bộ dữ liệu...');

        // 1. Lấy toàn bộ data từ Supabase
        const products = await this.productsService.findAll();

        if (!products || products.length === 0) {
            console.log('⚠️ Không có sản phẩm nào trong Supabase để đồng bộ.');
            return;
        }

        let successCount = 0;

        // 2. Duyệt qua từng sản phẩm và đẩy lên Pinecone
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            try {
                await this.addProductToVectorDB(product);
                successCount++;
                console.log(`[${successCount}/${products.length}] ✅ Đã đồng bộ: ${product.name}`);

                // Nghỉ 1.5 giây sau mỗi lần gọi để không vượt quá giới hạn 100 RPM của Google
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (error) {
                // Bắt được lỗi -> In ra lỗi và NGẮT LUÔN VÒNG LẶP bằng lệnh break
                console.error(`❌ LỖI NGHIÊM TRỌNG Ở SẢN PHẨM [${product.name}]. DỪNG TOÀN BỘ QUÁ TRÌNH!`);
                console.error('Chi tiết lỗi:', error);
                break;
            }
        }

        console.log(`🏁 Quá trình kết thúc. Đã đồng bộ thành công ${successCount}/${products.length} sản phẩm.`);
    }
    async checkAvailableModels() {
        console.log('🔍 Đang gọi thẳng lên Google qua REST API...');
        try {
            // Nhớ đảm bảo process.env.GEMINI_API_KEY đang có giá trị nhé
            const apiKey = process.env.GEMINI_API_KEY;
            console.log('🔑 API Key đang dùng:', apiKey ? 'Đã có' : 'Chưa có');

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            console.log('data', data);

        } catch (error) {
            console.error('❌ Lỗi khi gọi fetch:', error);
        }
    }
}