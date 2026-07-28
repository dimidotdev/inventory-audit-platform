import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { compareSync, hashSync } from 'bcryptjs';
import { DRIZZLE } from '../database/database.module';
import type { DrizzleDB } from '../database/database.module';
import { employees } from '../database/schema';
import { LoginDto, RegisterDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const [existing] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.email, dto.email))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const id = randomUUID();
    const senhaHash = hashSync(dto.senha, 10);

    await this.db.insert(employees).values({
      id,
      nome: dto.nome,
      email: dto.email,
      senha: senhaHash,
    });

    const payload: JwtPayload = {
      sub: id,
      email: dto.email,
      nome: dto.nome,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      employee: {
        id,
        nome: dto.nome,
        email: dto.email,
      },
    };
  }

  async login(dto: LoginDto) {
    const [employee] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.email, dto.email))
      .limit(1);

    if (!employee) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = compareSync(dto.senha, employee.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      nome: employee.nome,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      employee: {
        id: employee.id,
        nome: employee.nome,
        email: employee.email,
      },
    };
  }

  async getProfile(userId: string) {
    const [employee] = await this.db
      .select({
        id: employees.id,
        nome: employees.nome,
        email: employees.email,
      })
      .from(employees)
      .where(eq(employees.id, userId))
      .limit(1);

    if (!employee) {
      throw new UnauthorizedException('Funcionário não encontrado');
    }

    return employee;
  }
}
