import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';
import { StockCountsService } from './stock-counts.service';
import {
  CreateStockCountDto,
  UpdateStockCountItemDto,
  UpdateStockCountStatusDto,
} from './dto';

@ApiTags('Contagens de Estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StockCountsController {
  constructor(private readonly stockCountsService: StockCountsService) {}

  // ─── Contagens ─────────────────────────────────────────────

  @Get('contagens-estoque')
  @ApiOperation({
    summary: 'Listar contagens de estoque com filtros e paginação',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['EM_ANDAMENTO', 'FINALIZADA'],
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Buscar por código ou nome do responsável',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 20)',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de contagens.' })
  async findAll(
    @Query('status') status?: 'EM_ANDAMENTO' | 'FINALIZADA',
    @Query('busca') busca?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockCountsService.findAll({ status, busca, page, limit });
  }

  @Get('contagens-estoque/:id')
  @ApiOperation({
    summary: 'Buscar contagem por ID com itens agrupados por situação',
  })
  @ApiResponse({
    status: 200,
    description:
      'Contagem com itens agrupados em: aConferir, conferidos, faltantesExcedentes.',
  })
  @ApiResponse({ status: 404, description: 'Contagem não encontrada.' })
  async findOne(@Param('id') id: string) {
    return this.stockCountsService.findOne(id);
  }

  @Post('contagens-estoque')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova contagem de estoque (snapshot de todos os produtos)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Contagem criada. Os itens são gerados automaticamente com snapshot do estoque atual.',
  })
  @ApiResponse({
    status: 400,
    description: 'Não há produtos cadastrados com estoque.',
  })
  async create(
    @Body() dto: CreateStockCountDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockCountsService.create(dto, userId);
  }

  @Patch('contagens-estoque/:id/status')
  @ApiOperation({
    summary: 'Atualizar status da contagem (salvar parcial ou finalizar)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Contagem já finalizada.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStockCountStatusDto,
  ) {
    return this.stockCountsService.updateStatus(id, dto);
  }

  // ─── Itens da Contagem ────────────────────────────────────

  @Patch('itens-contagem-estoque/:id')
  @ApiOperation({
    summary:
      'Atualizar quantidade contada de um item (recalcula situação automaticamente)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Item atualizado. Situação recalculada: CONFERIDO ou FALTANTE_EXCEDENTE.',
  })
  @ApiResponse({
    status: 400,
    description: 'Observação obrigatória quando quantidade difere do sistema.',
  })
  @ApiResponse({
    status: 403,
    description: 'Contagem já finalizada.',
  })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateStockCountItemDto,
  ) {
    return this.stockCountsService.updateItem(id, dto);
  }
}
