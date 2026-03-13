package com.talentsphere.company.service;

import com.talentsphere.company.dto.CompanyRequest;
import com.talentsphere.company.dto.CompanyResponse;
import com.talentsphere.company.entity.Company;
import com.talentsphere.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional
    public CompanyResponse createCompany(CompanyRequest request) {
        Company company = Company.builder()
                .name(request.getName())
                .description(request.getDescription())
                .website(request.getWebsite())
                .industry(request.getIndustry())
                .size(request.getSize())
                .location(request.getLocation())
                .logoUrl(request.getLogoUrl())
                .coverImageUrl(request.getCoverImageUrl())
                .verified(request.getVerified() != null ? request.getVerified() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .employeeCount(request.getEmployeeCount())
                .foundedYear(request.getFoundedYear())
                .build();

        Company saved = companyRepository.save(company);
        return mapToResponse(saved);
    }

    @Transactional
    public CompanyResponse updateCompany(UUID id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        company.setName(request.getName());
        company.setDescription(request.getDescription());
        company.setWebsite(request.getWebsite());
        company.setIndustry(request.getIndustry());
        company.setSize(request.getSize());
        company.setLocation(request.getLocation());
        company.setLogoUrl(request.getLogoUrl());
        company.setCoverImageUrl(request.getCoverImageUrl());
        
        if (request.getVerified() != null) {
            company.setVerified(request.getVerified());
        }
        if (request.getActive() != null) {
            company.setActive(request.getActive());
        }
        if (request.getEmployeeCount() != null) {
            company.setEmployeeCount(request.getEmployeeCount());
        }
        if (request.getFoundedYear() != null) {
            company.setFoundedYear(request.getFoundedYear());
        }

        Company updated = companyRepository.save(company);
        return mapToResponse(updated);
    }

    public CompanyResponse getCompany(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        return mapToResponse(company);
    }

    public Page<CompanyResponse> getAllCompanies(Pageable pageable) {
        return companyRepository.findByActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    public Page<CompanyResponse> getVerifiedCompanies(Pageable pageable) {
        return companyRepository.findByVerifiedTrue(pageable)
                .map(this::mapToResponse);
    }

    public Page<CompanyResponse> searchByName(String name, Pageable pageable) {
        return companyRepository.findByNameContainingIgnoreCase(name, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public CompanyResponse verifyCompany(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        company.setVerified(true);
        Company verified = companyRepository.save(company);
        return mapToResponse(verified);
    }

    private CompanyResponse mapToResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .description(company.getDescription())
                .website(company.getWebsite())
                .industry(company.getIndustry())
                .size(company.getSize())
                .location(company.getLocation())
                .logoUrl(company.getLogoUrl())
                .coverImageUrl(company.getCoverImageUrl())
                .verified(company.getVerified())
                .active(company.getActive())
                .employeeCount(company.getEmployeeCount())
                .foundedYear(company.getFoundedYear())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
