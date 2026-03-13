package com.talentsphere.company.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.company.dto.CompanyRequest;
import com.talentsphere.company.dto.CompanyResponse;
import com.talentsphere.company.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(
            @Valid @RequestBody CompanyRequest request) {
        CompanyResponse created = companyService.createCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @PathVariable UUID id,
            @Valid @RequestBody CompanyRequest request) {
        CompanyResponse updated = companyService.updateCompany(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(@PathVariable UUID id) {
        CompanyResponse company = companyService.getCompany(id);
        return ResponseEntity.ok(ApiResponse.success(company));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> getAllCompanies(Pageable pageable) {
        Page<CompanyResponse> companies = companyService.getAllCompanies(pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @GetMapping("/verified")
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> getVerifiedCompanies(Pageable pageable) {
        Page<CompanyResponse> companies = companyService.getVerifiedCompanies(pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CompanyResponse>>> searchByName(
            @RequestParam String name,
            Pageable pageable) {
        Page<CompanyResponse> companies = companyService.searchByName(name, pageable);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<CompanyResponse>> verifyCompany(@PathVariable UUID id) {
        CompanyResponse verified = companyService.verifyCompany(id);
        return ResponseEntity.ok(ApiResponse.success(verified));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("company-service UP"));
    }
}
