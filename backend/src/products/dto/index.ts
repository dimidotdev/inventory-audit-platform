import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'ITEM-1001',
    description: 'Código do produto no sistema',
  })
  @IsString({ message: 'Código do sistema deve ser uma string' })
  @IsNotEmpty({ message: 'Código do sistema é obrigatório' })
  codigoSistema: string;

  @ApiProperty({
    example: 'Caixa organizadora 30 L',
    description: 'Nome do produto',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Quantidade inicial no estoque (padrão: 0)',
  })
  @IsOptional()
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantidadeEstoque?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Caixa organizadora 45 L',
    description: 'Nome do produto',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  nome?: string;

  @ApiPropertyOptional({
    example: 'ITEM-1001-B',
    description: 'Código do produto no sistema',
  })
  @IsOptional()
  @IsString({ message: 'Código do sistema deve ser uma string' })
  @IsNotEmpty({ message: 'Código do sistema não pode ser vazio' })
  codigoSistema?: string;
}

export class UpdateProductStockDto {
  @ApiProperty({ example: 75, description: 'Nova quantidade no sistema' })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantidadeSistema: number;
}
