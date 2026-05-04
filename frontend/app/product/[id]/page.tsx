
import axios from 'axios';
import ProductDetailClient from '../ProductDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        console.log('API URL:', apiUrl);
        const res = await axios.get(`${apiUrl}/products/${id}`);
        return res.data;
    } catch (error) {
        return null;
    }
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const product = await getProduct(id);
    console.log('producrt' , product);
    if (!product) {
        return <div className="p-10 text-center">Sản phẩm không tồn tại!</div>;
    }

    return <ProductDetailClient product={product} />;
}