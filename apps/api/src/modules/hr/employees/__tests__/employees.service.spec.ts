import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from '../employees.service';
import { EmployeesRepository } from '../employees.repository';
import { CountryContextService } from '../../../country-context/country-context.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EmploymentStatus, Gender } from '@prisma/client';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: jest.Mocked<EmployeesRepository>;
  let countryContextService: jest.Mocked<CountryContextService>;

  const mockEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    orgId: 'org-123',
    userId: null,
    employeeNumber: 'EMP-001',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@company.de',
    phone: '+49 30 12345678',
    dateOfBirth: new Date('1990-05-15'),
    gender: Gender.MALE,
    nationality: 'DE',
    street: 'Hauptstraße 123',
    city: 'Berlin',
    postalCode: '10115',
    countryCode: 'DE',
    taxId: '12345678901',
    taxClass: '1',
    churchTax: false,
    bankName: 'Deutsche Bank',
    iban: 'DE89370400440532013000',
    bic: 'DEUTDEFF',
    status: EmploymentStatus.ACTIVE,
    hireDate: new Date('2024-01-15'),
    terminationDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    contracts: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByEmployeeNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      emailExists: jest.fn(),
      employeeNumberExists: jest.fn(),
      findContracts: jest.fn(),
      findActiveContract: jest.fn(),
      findContractById: jest.fn(),
      createContract: jest.fn(),
      updateContract: jest.fn(),
      deactivateEmployeeContracts: jest.fn(),
    };

    const mockCountryContextService = {
      findCountryByCode: jest.fn(),
      getEmploymentTypes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: EmployeesRepository,
          useValue: mockRepository,
        },
        {
          provide: CountryContextService,
          useValue: mockCountryContextService,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get(EmployeesRepository);
    countryContextService = module.get(CountryContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return an employee when found', async () => {
      repository.findById.mockResolvedValue(mockEmployee);

      const result = await service.findById(mockEmployee.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEmployee.id);
      expect(result.iban).toMatch(/^DE89\*+000$/); // Masked IBAN
      expect(result.taxId).toMatch(/^\*+901$/); // Masked tax ID
      expect(repository.findById).toHaveBeenCalledWith(mockEmployee.id, {
        contracts: {
          where: { isActive: true },
        },
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when employee is soft-deleted', async () => {
      repository.findById.mockResolvedValue({
        ...mockEmployee,
        deletedAt: new Date(),
      });

      await expect(service.findById(mockEmployee.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      employeeNumber: 'EMP-001',
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@company.de',
      phone: '+49 30 12345678',
      dateOfBirth: '1990-05-15',
      gender: Gender.MALE,
      nationality: 'DE',
      street: 'Hauptstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      countryCode: 'DE',
      taxId: '12345678901',
      taxClass: '1',
      churchTax: false,
      bankName: 'Deutsche Bank',
      iban: 'DE89370400440532013000',
      bic: 'DEUTDEFF',
      status: EmploymentStatus.ACTIVE,
      hireDate: '2024-01-15',
    };

    it('should create an employee successfully', async () => {
      countryContextService.findCountryByCode.mockResolvedValue({
        id: 'country-1',
        code: 'DE',
        name: 'Germany',
      } as any);
      repository.employeeNumberExists.mockResolvedValue(false);
      repository.emailExists.mockResolvedValue(false);
      repository.create.mockResolvedValue(mockEmployee);

      const result = await service.create('org-123', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEmployee.id);
      expect(countryContextService.findCountryByCode).toHaveBeenCalledWith('DE');
      expect(repository.employeeNumberExists).toHaveBeenCalledWith(
        'org-123',
        'EMP-001',
      );
      expect(repository.emailExists).toHaveBeenCalledWith(
        'org-123',
        createDto.email,
      );
    });

    it('should throw ConflictException when employee number exists', async () => {
      countryContextService.findCountryByCode.mockResolvedValue({
        id: 'country-1',
        code: 'DE',
        name: 'Germany',
      } as any);
      repository.employeeNumberExists.mockResolvedValue(true);

      await expect(service.create('org-123', createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when email exists', async () => {
      countryContextService.findCountryByCode.mockResolvedValue({
        id: 'country-1',
        code: 'DE',
        name: 'Germany',
      } as any);
      repository.employeeNumberExists.mockResolvedValue(false);
      repository.emailExists.mockResolvedValue(true);

      await expect(service.create('org-123', createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for unsupported country', async () => {
      countryContextService.findCountryByCode.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.create('org-123', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Max Updated',
      email: 'max.updated@company.de',
    };

    it('should update an employee successfully', async () => {
      repository.findById.mockResolvedValue(mockEmployee);
      repository.emailExists.mockResolvedValue(false);
      repository.update.mockResolvedValue({
        ...mockEmployee,
        ...updateDto,
      });

      const result = await service.update(mockEmployee.id, updateDto);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(updateDto.firstName);
    });

    it('should throw NotFoundException when employee not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updating to existing email', async () => {
      repository.findById.mockResolvedValue(mockEmployee);
      repository.emailExists.mockResolvedValue(true);

      await expect(service.update(mockEmployee.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete an employee successfully', async () => {
      repository.findById.mockResolvedValue(mockEmployee);
      repository.softDelete.mockResolvedValue({
        ...mockEmployee,
        deletedAt: new Date(),
      });

      await service.softDelete(mockEmployee.id);

      expect(repository.softDelete).toHaveBeenCalledWith(mockEmployee.id);
    });

    it('should throw NotFoundException when employee not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted employee', async () => {
      const deletedEmployee = {
        ...mockEmployee,
        deletedAt: new Date(),
      };
      repository.findById.mockResolvedValue(deletedEmployee);
      repository.restore.mockResolvedValue(mockEmployee);

      const result = await service.restore(mockEmployee.id);

      expect(result).toBeDefined();
      expect(repository.restore).toHaveBeenCalledWith(mockEmployee.id);
    });

    it('should throw BadRequestException when employee is not deleted', async () => {
      repository.findById.mockResolvedValue(mockEmployee);

      await expect(service.restore(mockEmployee.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateTaxInfo', () => {
    const taxInfoDto = {
      taxId: '98765432109',
      taxClass: '3',
      churchTax: true,
    };

    it('should update tax information successfully', async () => {
      repository.findById.mockResolvedValue(mockEmployee);
      repository.update.mockResolvedValue({
        ...mockEmployee,
        ...taxInfoDto,
      });

      const result = await service.updateTaxInfo(mockEmployee.id, taxInfoDto);

      expect(result).toBeDefined();
      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('updateBanking', () => {
    const bankingDto = {
      bankName: 'Commerzbank',
      iban: 'DE89370400440532013001',
      bic: 'COBADEFF',
    };

    it('should update banking information successfully', async () => {
      repository.findById.mockResolvedValue(mockEmployee);
      repository.update.mockResolvedValue({
        ...mockEmployee,
        ...bankingDto,
      });

      const result = await service.updateBanking(mockEmployee.id, bankingDto);

      expect(result).toBeDefined();
      expect(repository.update).toHaveBeenCalled();
    });
  });
});
