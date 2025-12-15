import { Controller, Get, Query } from '@nestjs/common';
import { TinkService } from '../../integrations/tink/tink.service';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Public Banks Controller
 * Public endpoint for fetching available banks by country (no auth required for onboarding)
 */
@Controller('bank-connections')
export class BanksController {
  constructor(private readonly tinkService: TinkService) {}

  /**
   * Get available banks for a country
   * GET /bank-connections/banks?country=DE
   */
  @Public()
  @Get('banks')
  async getBanks(@Query('country') country: string) {
    if (!country) {
      return { data: [] };
    }

    // European countries that use Tink
    const euroCountries = ['DE', 'AT', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI', 'IE', 'CH'];

    if (euroCountries.includes(country.toUpperCase())) {
      try {
        const providers = await this.tinkService.getProviders(country.toUpperCase());
        return {
          data: providers.map(p => ({
            id: p.name || p.financialInstitution?.id || p.id,
            name: p.displayName || p.financialInstitution?.name || p.name,
            logo: p.images?.icon || p.image || p.logo || null,
            country: p.market || country.toUpperCase(),
            bic: null,
          }))
        };
      } catch (error) {
        console.error('Error fetching banks from Tink:', error);
        return { data: [] };
      }
    }

    // For US (Plaid) and UK (TrueLayer), return empty - they use embedded widgets
    return { data: [] };
  }
}
