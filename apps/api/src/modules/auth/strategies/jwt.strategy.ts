import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { ConfigService } from '@nestjs/config';

type JwtPayload = {
    sub: string;
    email: string;
    iat: number;
    exp: number;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request.cookies?.access_token,
            ]),
            secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        return payload;
    }
}