import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
  Matches,
} from 'class-validator';

export class CreateStockCountDto {
  @ApiProperty({
    example: '2026-02-15',
    description: 'Data agendada para a contagem (YYYY-MM-DD)',
  })
  @IsString({ message: 'Data deve ser uma string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data deve estar no formato YYYY-MM-DD',
  })
  dataAgendada: string;

  @ApiPropertyOptional({
    example: 'uuid-do-funcionario',
    description:
      'ID do funcionário responsável. Se omitido, usa o usuário autenticado.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do responsável deve ser um UUID válido' })
  responsavelId?: string;
}

export class UpdateStockCountItemDto {
  @ApiProperty({
    example: 'uuid-da-contagem',
    description: 'ID da contagem de estoque à qual o item pertence',
  })
  @IsUUID('4', { message: 'ID da contagem deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da contagem é obrigatório' })
  contagemEstoqueId: string;

  @ApiProperty({
    example: 10,
    description: 'Quantidade contada pelo funcionário',
  })
  @IsInt({ message: 'Quantidade contada deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade contada não pode ser negativa' })
  quantidadeContada: number;

  @ApiPropertyOptional({
    example: 'Produto danificado',
    description:
      'Observação obrigatória quando a quantidade contada difere da quantidade do sistema',
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  observacao?: string;
}

export class UpdateStockCountStatusDto {
  @ApiProperty({
    example: 'FINALIZADA',
    enum: ['EM_ANDAMENTO', 'FINALIZADA'],
    description: 'Novo status da contagem',
  })
  @IsEnum(['EM_ANDAMENTO', 'FINALIZADA'], {
    message: 'Status deve ser EM_ANDAMENTO ou FINALIZADA',
  })
  status: 'EM_ANDAMENTO' | 'FINALIZADA';
}
