import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CountryContextService } from '../country-context.service';
import { CountryContextRepository } from '../country-context.repository';

describe('CountryContextService', () => {
  let service: CountryContextService;
  let repository: CountryContextRepository;

  const mockCountry = {
    id: '1',
    code: 'DE',
    code3: 'DEU',
    name: 'Germany',
    nameNative: 'Deutschland',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    timezone: 'Europe/Berlin',
    fiscalYearStart: '01-01',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    vatRates: [
      {
        id: '1',
        countryId: '1',
        name: 'Standard',
        rate: 19.0,
        validFrom: new Date('2020-01-01'),
        validTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    features: [
      {
        id: '1',
        countryId: '1',
        feature: 'tax_filing',
        enabled: true,
        config: { provider: 'ELSTER' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockRepository = {
    findAllCountries: jest.fn(),
    countCountries: jest.fn(),
    findCountryByCode: jest.fn(),
    findCountryById: jest.fn(),
    findRegionsByCountryCode: jest.fn(),
    findVatRatesByCountryCode: jest.fn(),
    findDeductionCategoriesByCountryCode: jest.fn(),
    findEmploymentTypesByCountryCode: jest.fn(),
    findOrganisationCountries: jest.fn(),
    addCountryToOrganisation: jest.fn(),
    removeCountryFromOrganisation: jest.fn(),
    organisationHasCountry: jest.fn(),
    findTaxCredentialsByOrganisation: jest.fn(),
    findTaxCredentialById: jest.fn(),
    createTaxCredential: jest.fn(),
    updateTaxCredential: jest.fn(),
    deleteTaxCredential: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountryContextService,
        {
          provide: CountryContextRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CountryContextService>(CountryContextService);
    repository = module.get<CountryContextRepository>(CountryContextRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllCountries', () => {
    it('should return paginated list of countries', async () => {
      const countries = [mockCountry];
      mockRepository.findAllCountries.mockResolvedValue(countries);
      mockRepository.countCountries.mockResolvedValue(1);

      const result = await service.findAllCountries({ page: 1, pageSize: 20 });

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            code: 'DE',
            name: 'Germany',
          }),
        ]),
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
        },
      });
      expect(mockRepository.findAllCountries).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should filter by active status', async () => {
      mockRepository.findAllCountries.mockResolvedValue([mockCountry]);
      mockRepository.countCountries.mockResolvedValue(1);

      await service.findAllCountries({ isActive: true, page: 1, pageSize: 20 });

      expect(mockRepository.findAllCountries).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });
  });

  describe('findCountryByCode', () => {
    it('should return country by code', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);

      const result = await service.findCountryByCode('DE');

      expect(result).toEqual(
        expect.objectContaining({
          code: 'DE',
          name: 'Germany',
        }),
      );
      expect(mockRepository.findCountryByCode).toHaveBeenCalledWith(
        'DE',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if country not found', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(null);

      await expect(service.findCountryByCode('XX')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRegions', () => {
    it('should return regions for country', async () => {
      const regions = [
        {
          id: '1',
          countryId: '1',
          code: 'BY',
          name: 'Bavaria',
          nameNative: 'Bayern',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.findRegionsByCountryCode.mockResolvedValue(regions);

      const result = await service.getRegions('DE');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code: 'BY',
        name: 'Bavaria',
      });
    });

    it('should throw NotFoundException if country not found', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(null);

      await expect(service.getRegions('XX')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVatRates', () => {
    it('should return VAT rates for country', async () => {
      const vatRates = [
        {
          id: '1',
          countryId: '1',
          name: 'Standard',
          rate: { toString: () => '19.00' },
          validFrom: new Date('2020-01-01'),
          validTo: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.findVatRatesByCountryCode.mockResolvedValue(vatRates);

      const result = await service.getVatRates('DE');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Standard',
        rate: 19.0,
      });
    });

    it('should accept date parameter', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.findVatRatesByCountryCode.mockResolvedValue([]);

      await service.getVatRates('DE', '2020-01-01');

      expect(mockRepository.findVatRatesByCountryCode).toHaveBeenCalledWith(
        'DE',
        expect.any(Date),
      );
    });
  });

  describe('addCountryToOrganisation', () => {
    it('should add country to organisation', async () => {
      const orgCountry = {
        id: '1',
        orgId: 'org1',
        countryId: '1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        country: mockCountry,
      };
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.organisationHasCountry.mockResolvedValue(false);
      mockRepository.addCountryToOrganisation.mockResolvedValue(orgCountry);

      const result = await service.addCountryToOrganisation('org1', 'DE');

      expect(result).toMatchObject({
        orgId: 'org1',
        countryId: '1',
      });
      expect(mockRepository.addCountryToOrganisation).toHaveBeenCalledWith(
        'org1',
        '1',
      );
    });

    it('should throw NotFoundException if country not found', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(null);

      await expect(
        service.addCountryToOrganisation('org1', 'XX'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if country already added', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.organisationHasCountry.mockResolvedValue(true);

      await expect(
        service.addCountryToOrganisation('org1', 'DE'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeCountryFromOrganisation', () => {
    it('should remove country from organisation', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.organisationHasCountry.mockResolvedValue(true);
      mockRepository.removeCountryFromOrganisation.mockResolvedValue({});

      await service.removeCountryFromOrganisation('org1', 'DE');

      expect(mockRepository.removeCountryFromOrganisation).toHaveBeenCalledWith(
        'org1',
        'DE',
      );
    });

    it('should throw NotFoundException if country not found', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(null);

      await expect(
        service.removeCountryFromOrganisation('org1', 'XX'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if country not in organisation', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.organisationHasCountry.mockResolvedValue(false);

      await expect(
        service.removeCountryFromOrganisation('org1', 'DE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTaxCredential', () => {
    it('should create tax credential', async () => {
      const credential = {
        id: '1',
        orgId: 'org1',
        countryCode: 'DE',
        type: 'TAX_ID',
        name: 'German Tax ID',
        value: 'encrypted-value',
        expiresAt: null,
        isActive: true,
        lastVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findCountryByCode.mockResolvedValue(mockCountry);
      mockRepository.createTaxCredential.mockResolvedValue(credential);

      const result = await service.createTaxCredential('org1', {
        countryCode: 'DE',
        type: 'TAX_ID' as any,
        name: 'German Tax ID',
        value: '12/345/67890',
      });

      expect(result).toMatchObject({
        orgId: 'org1',
        countryCode: 'DE',
        type: 'TAX_ID',
      });
    });

    it('should throw NotFoundException if country not found', async () => {
      mockRepository.findCountryByCode.mockResolvedValue(null);

      await expect(
        service.createTaxCredential('org1', {
          countryCode: 'XX',
          type: 'TAX_ID' as any,
          name: 'Tax ID',
          value: '123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTaxCredential', () => {
    it('should update tax credential', async () => {
      const existing = {
        id: '1',
        orgId: 'org1',
        countryCode: 'DE',
        type: 'TAX_ID',
        name: 'German Tax ID',
        value: 'encrypted-value',
        expiresAt: null,
        isActive: true,
        lastVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, name: 'Updated Tax ID' };

      mockRepository.findTaxCredentialById.mockResolvedValue(existing);
      mockRepository.updateTaxCredential.mockResolvedValue(updated);

      const result = await service.updateTaxCredential('org1', '1', {
        name: 'Updated Tax ID',
      });

      expect(result.name).toBe('Updated Tax ID');
    });

    it('should throw NotFoundException if credential not found', async () => {
      mockRepository.findTaxCredentialById.mockResolvedValue(null);

      await expect(
        service.updateTaxCredential('org1', 'invalid', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if credential belongs to different org', async () => {
      const existing = {
        id: '1',
        orgId: 'org2',
        countryCode: 'DE',
        type: 'TAX_ID',
        name: 'Tax ID',
        value: 'value',
        expiresAt: null,
        isActive: true,
        lastVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findTaxCredentialById.mockResolvedValue(existing);

      await expect(
        service.updateTaxCredential('org1', '1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTaxCredential', () => {
    it('should delete tax credential', async () => {
      const existing = {
        id: '1',
        orgId: 'org1',
        countryCode: 'DE',
        type: 'TAX_ID',
        name: 'Tax ID',
        value: 'value',
        expiresAt: null,
        isActive: true,
        lastVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findTaxCredentialById.mockResolvedValue(existing);
      mockRepository.deleteTaxCredential.mockResolvedValue(existing);

      await service.deleteTaxCredential('org1', '1');

      expect(mockRepository.deleteTaxCredential).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if credential not found', async () => {
      mockRepository.findTaxCredentialById.mockResolvedValue(null);

      await expect(service.deleteTaxCredential('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
