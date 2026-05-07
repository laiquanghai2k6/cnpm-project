import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
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
    this.logger.debug(`Giải mã thành công! Payload: ${JSON.stringify(payload)}`);
    return { userId: payload.sub, email: payload.email };
  }
}