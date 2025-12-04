import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SvMeldungService } from '../sv-meldung.service';
import { RedisService } from '../../../cache/redis.service';
import { SvAnmeldungDto } from '../dto/sv-anmeldung.dto';
import { SvAbmeldungDto } from '../dto/sv-abmeldung.dto';
import { SvAenderungDto, AenderungType } from '../dto/sv-aenderung.dto';
import { SvResponseStatus } from '../interfaces/sv-response.interface';
import { Abgabegrund } from '../interfaces/deuev-message.interface';

describe('SvMeldungService', () => {
  let service: SvMeldungService;
  let redisService: RedisService;
  let configService: ConfigService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    delByPattern: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        SV_ABSENDER: 'TEST-ABSENDER',
        SV_BETRIEBSNUMMER: '12345678',
        COMPANY_NAME: 'Test GmbH',
        SV_TEST_MODE: true,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SvMeldungService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SvMeldungService>(SvMeldungService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAnmeldung', () => {
    it('should create a valid Anmeldung', async () => {
      const anmeldungDto: SvAnmeldungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '12345678',
        versicherungsnummer: '12345678A901',
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        geschlecht: 'M',
        staatsangehoerigkeit: 'DEU',
        anschrift: {
          strasse: 'Hauptstrasse',
          hausnummer: '10',
          plz: '10115',
          ort: 'Berlin',
        },
        beschaeftigungBeginn: '2024-01-01',
        beitragsgruppen: {
          kv: '1',
          rv: '1',
          av: '1',
          pv: '1',
        },
        entgelt: 3500,
        personengruppe: '101',
        krankenkasseIk: '108018347',
        krankenkasseName: 'AOK',
      };

      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.createAnmeldung(anmeldungDto);

      expect(result).toBeDefined();
      expect(result.submissionId).toBeDefined();
      expect(result.messageType).toBe('ANMELDUNG');
      expect(result.status).toBe(SvResponseStatus.PENDING);
      expect(result.recordsSubmitted).toBe(1);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should reject invalid Betriebsnummer', async () => {
      const anmeldungDto: SvAnmeldungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '1234567', // Invalid: only 7 digits
        versicherungsnummer: '12345678A901',
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        geschlecht: 'M',
        staatsangehoerigkeit: 'DEU',
        anschrift: {
          strasse: 'Hauptstrasse',
          hausnummer: '10',
          plz: '10115',
          ort: 'Berlin',
        },
        beschaeftigungBeginn: '2024-01-01',
        beitragsgruppen: {
          kv: '1',
          rv: '1',
          av: '1',
          pv: '1',
        },
        personengruppe: '101',
        krankenkasseIk: '108018347',
      };

      await expect(service.createAnmeldung(anmeldungDto)).rejects.toThrow();
    });

    it('should reject invalid Versicherungsnummer', async () => {
      const anmeldungDto: SvAnmeldungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '12345678',
        versicherungsnummer: 'INVALID123', // Invalid format
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        geschlecht: 'M',
        staatsangehoerigkeit: 'DEU',
        anschrift: {
          strasse: 'Hauptstrasse',
          hausnummer: '10',
          plz: '10115',
          ort: 'Berlin',
        },
        beschaeftigungBeginn: '2024-01-01',
        beitragsgruppen: {
          kv: '1',
          rv: '1',
          av: '1',
          pv: '1',
        },
        personengruppe: '101',
        krankenkasseIk: '108018347',
      };

      await expect(service.createAnmeldung(anmeldungDto)).rejects.toThrow();
    });
  });

  describe('createAbmeldung', () => {
    it('should create a valid Abmeldung', async () => {
      const abmeldungDto: SvAbmeldungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '12345678',
        versicherungsnummer: '12345678A901',
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        beschaeftigungEnde: '2024-12-31',
      };

      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.createAbmeldung(abmeldungDto);

      expect(result).toBeDefined();
      expect(result.submissionId).toBeDefined();
      expect(result.messageType).toBe('ABMELDUNG');
      expect(result.status).toBe(SvResponseStatus.PENDING);
    });
  });

  describe('createAenderung', () => {
    it('should create a valid Änderung for salary change', async () => {
      const aenderungDto: SvAenderungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '12345678',
        versicherungsnummer: '12345678A901',
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        aenderungsdatum: '2024-06-01',
        aenderungType: AenderungType.ENTGELT,
        neuesEntgelt: 4000,
      };

      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.createAenderung(aenderungDto);

      expect(result).toBeDefined();
      expect(result.submissionId).toBeDefined();
      expect(result.messageType).toBe('AENDERUNG');
      expect(result.status).toBe(SvResponseStatus.PENDING);
    });
  });

  describe('generateDeuevMessage', () => {
    it('should generate valid DEÜV message for Anmeldung', async () => {
      const anmeldungDto: SvAnmeldungDto = {
        employeeId: 'emp_123',
        betriebsnummer: '12345678',
        versicherungsnummer: '12345678A901',
        nachname: 'Müller',
        vorname: 'Hans',
        geburtsdatum: '1990-01-15',
        geschlecht: 'M',
        staatsangehoerigkeit: 'DEU',
        anschrift: {
          strasse: 'Hauptstrasse',
          hausnummer: '10',
          plz: '10115',
          ort: 'Berlin',
        },
        beschaeftigungBeginn: '2024-01-01',
        beitragsgruppen: {
          kv: '1',
          rv: '1',
          av: '1',
          pv: '1',
        },
        personengruppe: '101',
        krankenkasseIk: '108018347',
      };

      const message = await service.generateDeuevMessage(
        'ANMELDUNG',
        anmeldungDto,
      );

      expect(message).toBeDefined();
      expect(message).toContain('VOSZ'); // Header
      expect(message).toContain('DSME'); // Main record
      expect(message).toContain('DSKK'); // Carrier record
    });
  });

  describe('getSubmissionStatus', () => {
    it('should retrieve submission status', async () => {
      const mockSubmission = {
        submissionId: 'sub_123',
        status: SvResponseStatus.ACCEPTED,
        submittedAt: new Date(),
        carrierId: '108018347',
        messageType: 'ANMELDUNG',
        recordsSubmitted: 1,
        recordsAccepted: 1,
        recordsRejected: 0,
        errors: [],
      };

      mockRedisService.get.mockResolvedValue(mockSubmission);

      const result = await service.getSubmissionStatus('sub_123');

      expect(result).toBeDefined();
      expect(result?.submissionId).toBe('sub_123');
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'sv-meldung:submission:sub_123',
      );
    });

    it('should return null for non-existent submission', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getSubmissionStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getEmployeeSubmissions', () => {
    it('should retrieve all employee submissions', async () => {
      const mockKeys = [
        'sv-meldung:employee:emp_123:sub_1',
        'sv-meldung:employee:emp_123:sub_2',
      ];

      const mockSubmissions = [
        {
          submissionId: 'sub_1',
          employeeId: 'emp_123',
          messageType: 'ANMELDUNG',
          dataHash: 'hash1',
          submittedAt: '2024-01-01T00:00:00Z',
          status: SvResponseStatus.ACCEPTED,
          expiresAt: '2024-02-01T00:00:00Z',
        },
        {
          submissionId: 'sub_2',
          employeeId: 'emp_123',
          messageType: 'AENDERUNG',
          dataHash: 'hash2',
          submittedAt: '2024-01-15T00:00:00Z',
          status: SvResponseStatus.PENDING,
          expiresAt: '2024-02-15T00:00:00Z',
        },
      ];

      mockRedisService.keys.mockResolvedValue(mockKeys);
      mockRedisService.get
        .mockResolvedValueOnce(mockSubmissions[0])
        .mockResolvedValueOnce(mockSubmissions[1]);

      const result = await service.getEmployeeSubmissions('emp_123');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].submissionId).toBe('sub_2'); // Sorted by date desc
    });
  });
});
