import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET!,
      // THÊM DÒNG NÀY ĐỂ CHẤP NHẬN THUẬT TOÁN CỦA SUPABASE
      algorithms: ['HS256', 'ES256'], 
    });
  }

  async validate(payload: any) {
    console.log('Giải mã thành công! Payload:', payload);
    return { userId: payload.sub, email: payload.email };
  }
}