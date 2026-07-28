import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStockDto,
} from './dto';

@ApiTags('Produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('produtos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos com estoque (busca e paginação)' })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Buscar por código ou nome do produto',
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
    description: 'Itens por página (padrão: 50)',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de produtos.' })
  async findAll(
    @Query('busca') busca?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll({ busca, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo produto com estoque inicial' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Código de sistema duplicado.' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/estoque')
  @ApiOperation({ summary: 'Atualizar quantidade no estoque' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ) {
    return this.productsService.updateStock(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover produto' })
  @ApiResponse({ status: 200, description: 'Produto removido.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
