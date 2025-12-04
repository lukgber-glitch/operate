import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MultiCurrencyService } from './multi-currency.service';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateRefreshScheduler } from './jobs/exchange-rate-refresh.scheduler';
import {
  CurrencyDto,
  ConvertCurrencyDto,
  ConvertCurrencyResponseDto,
  FormatAmountDto,
  FormatAmountResponseDto,
  ParseAmountDto,
  ParseAmountResponseDto,
} from './dto';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: MultiCurrencyService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly exchangeRateScheduler: ExchangeRateRefreshScheduler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all supported currencies' })
  @ApiResponse({
    status: 200,
    description: 'Returns all supported currencies',
    type: [CurrencyDto],
  })
  getAllCurrencies(): CurrencyDto[] {
    return this.currencyService.getAllCurrencies();
  }

  @Get('codes')
  @ApiOperation({ summary: 'Get list of supported currency codes' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of currency codes',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['USD', 'EUR', 'GBP', 'CHF'],
    },
  })
  getSupportedCurrencyCodes(): string[] {
    return this.currencyService.getSupportedCurrencyCodes();
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get currencies grouped by region' })
  @ApiResponse({
    status: 200,
    description: 'Returns currencies grouped by geographic region',
  })
  getCurrenciesByRegion() {
    return this.currencyService.getCurrenciesByRegion();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get currency details by code' })
  @ApiParam({
    name: 'code',
    description: 'ISO 4217 currency code',
    example: 'USD',
  })
  @ApiQuery({
    name: 'includeExamples',
    required: false,
    type: Boolean,
    description: 'Include formatted examples',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns currency details',
    type: CurrencyDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid currency code' })
  getCurrency(
    @Param('code') code: string,
    @Query('includeExamples') includeExamples?: boolean,
  ) {
    if (includeExamples === true) {
      return this.currencyService.getCurrencyWithExamples(code);
    }
    return this.currencyService.getCurrency(code);
  }

  @Get('country/:countryCode')
  @ApiOperation({ summary: 'Get currency for a country' })
  @ApiParam({
    name: 'countryCode',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns currency used in the country',
    type: CurrencyDto,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  getCurrencyByCountry(@Param('countryCode') countryCode: string) {
    const currency = this.currencyService.getCurrencyByCountry(countryCode);
    if (!currency) {
      return {
        error: `No currency found for country code: ${countryCode}`,
        countryCode,
      };
    }
    return currency;
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiResponse({
    status: 200,
    description: 'Returns converted amount',
    type: ConvertCurrencyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or currency codes' })
  convertCurrency(
    @Body() dto: ConvertCurrencyDto,
  ): ConvertCurrencyResponseDto {
    const convertedAmount = this.currencyService.convert(
      dto.amount,
      dto.from,
      dto.to,
      dto.rate,
    );

    const rate = dto.rate ?? 1;

    return {
      amount: dto.amount,
      from: dto.from.toUpperCase(),
      to: dto.to.toUpperCase(),
      convertedAmount,
      rate,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('format')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Format amount with currency' })
  @ApiResponse({
    status: 200,
    description: 'Returns formatted amount',
    type: FormatAmountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or currency code' })
  formatAmount(@Body() dto: FormatAmountDto): FormatAmountResponseDto {
    const formatted = this.currencyService.formatAmount(
      dto.amount,
      dto.currency,
      dto.locale,
      {
        showSymbol: dto.showSymbol,
        showCode: dto.showCode,
      },
    );

    const currency = this.currencyService.getCurrency(dto.currency);

    return {
      formatted,
      currency: currency.code,
      locale: dto.locale || currency.locale || 'en-US',
    };
  }

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse amount from string' })
  @ApiResponse({
    status: 200,
    description: 'Returns parsed numeric amount',
    type: ParseAmountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input format or currency code',
  })
  parseAmount(@Body() dto: ParseAmountDto): ParseAmountResponseDto {
    const amount = this.currencyService.parseAmount(
      dto.input,
      dto.currency,
      dto.locale,
    );

    return {
      amount,
      currency: dto.currency.toUpperCase(),
      input: dto.input,
    };
  }

  @Get('compare/:code1/:code2')
  @ApiOperation({ summary: 'Compare two currencies' })
  @ApiParam({
    name: 'code1',
    description: 'First currency code',
    example: 'USD',
  })
  @ApiParam({
    name: 'code2',
    description: 'Second currency code',
    example: 'EUR',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns comparison of two currencies',
  })
  compareCurrencies(
    @Param('code1') code1: string,
    @Param('code2') code2: string,
  ) {
    return this.currencyService.compareCurrencies(code1, code2);
  }

  @Get('rates/:from/:to')
  @ApiOperation({ summary: 'Get exchange rate for currency pair' })
  @ApiParam({
    name: 'from',
    description: 'Source currency code',
    example: 'USD',
  })
  @ApiParam({
    name: 'to',
    description: 'Target currency code',
    example: 'EUR',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current exchange rate',
  })
  @ApiResponse({ status: 400, description: 'Invalid currency codes' })
  async getExchangeRate(@Param('from') from: string, @Param('to') to: string) {
    return this.exchangeRateService.getRate(from, to);
  }

  @Get('rates/:base')
  @ApiOperation({ summary: 'Get all exchange rates for base currency' })
  @ApiParam({
    name: 'base',
    description: 'Base currency code',
    example: 'USD',
  })
  @ApiQuery({
    name: 'targets',
    required: false,
    type: String,
    description: 'Comma-separated target currency codes',
    example: 'EUR,GBP,CHF',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns exchange rates for base currency',
  })
  @ApiResponse({ status: 400, description: 'Invalid currency code' })
  async getAllRatesForBase(
    @Param('base') base: string,
    @Query('targets') targetsParam?: string,
  ) {
    const targets = targetsParam
      ? targetsParam.split(',').map((t) => t.trim())
      : this.currencyService.getSupportedCurrencyCodes();

    const result = await this.exchangeRateService.getRates(base, targets);

    return {
      base: result.base,
      rates: Object.fromEntries(result.rates),
      source: result.source,
      timestamp: result.timestamp,
    };
  }

  @Get('rates/historical/:from/:to/:date')
  @ApiOperation({ summary: 'Get historical exchange rate for specific date' })
  @ApiParam({
    name: 'from',
    description: 'Source currency code',
    example: 'USD',
  })
  @ApiParam({
    name: 'to',
    description: 'Target currency code',
    example: 'EUR',
  })
  @ApiParam({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns historical exchange rate',
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters or no data available' })
  async getHistoricalRate(
    @Param('from') from: string,
    @Param('to') to: string,
    @Param('date') dateStr: string,
  ) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    return this.exchangeRateService.getHistoricalRate(from, to, date);
  }

  @Post('rates/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force refresh exchange rates',
    description: 'Manually trigger exchange rate refresh from external API',
  })
  @ApiQuery({
    name: 'baseCurrency',
    required: false,
    type: String,
    description: 'Base currency to refresh (default: USD)',
    example: 'USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Refresh job scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Exchange rate API not configured' })
  async refreshExchangeRates(@Query('baseCurrency') baseCurrency?: string) {
    const jobId = await this.exchangeRateScheduler.scheduleImmediateRefresh(
      baseCurrency || 'USD',
    );

    return {
      jobId,
      message: 'Exchange rate refresh scheduled',
      baseCurrency: (baseCurrency || 'USD').toUpperCase(),
    };
  }
}
